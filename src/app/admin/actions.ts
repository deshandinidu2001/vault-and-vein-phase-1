"use server"

import { randomUUID } from "node:crypto"
import { headers } from "next/headers"
import { revalidatePath, updateTag } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { adminAuthConfigured, endAdminSession, requireAdminDatabase, startAdminSession } from "@/lib/admin-auth"
import { Prisma } from "@/generated/prisma/client"
import { expireCheckouts } from "@/lib/checkout"
import { publicSettingsTag } from "@/lib/backend"
import { productFlags, productInput, slugInput } from "@/lib/admin-product"
import { readGemCategories } from "@/lib/gem-categories"
import { discardProductPhoto, uploadProductPhoto } from "@/lib/cloudinary"
import { permitRequest } from "@/lib/http"
import { getStoneOptions } from "@/lib/data"
import { configurableShopOptions, customShopOption, normalizeShopOption, shopFilterConfig, shopFilterControls } from "@/lib/shop-filter-config"
import { readShopFilterSettings } from "@/lib/shop-filter-settings"

const credentials = z.object({ email: z.email().max(254), password: z.string().min(1).max(128) })

function refreshCatalogue() {
  revalidatePath("/admin")
  revalidatePath("/")
  revalidatePath("/shop")
  revalidatePath("/shop/[slug]", "page")
}

export async function signIn(form: FormData) {
  if (!adminAuthConfigured) redirect("/admin/login")
  const input = credentials.safeParse(Object.fromEntries(form))
  if (!input.success) redirect("/admin/login?result=denied")
  const request = new Request("http://internal/admin", { headers: await headers() })
  let allowed: boolean
  try {
    allowed = await permitRequest(request, "admin-login", input.data.email)
  } catch {
    redirect("/admin/login?result=unavailable")
  }
  if (!allowed) redirect("/admin/login?result=limited")
  let signedIn: boolean
  try {
    signedIn = await startAdminSession(input.data.email, input.data.password)
  } catch {
    redirect("/admin/login?result=unavailable")
  }
  if (!signedIn) redirect("/admin/login?result=denied")
  redirect("/admin")
}

export async function signOut() {
  if (adminAuthConfigured) await endAdminSession()
  redirect("/admin/login")
}

export async function saveProduct(id: string | null, form: FormData) {
  const db = await requireAdminDatabase()
  if (id !== null && !z.uuid().safeParse(id).success) redirect("/admin")
  const returnTo = id ? "/admin/products/" + id : "/admin/products/new"
  const input = productInput.safeParse({
    ...Object.fromEntries(form),
    ...Object.fromEntries(productFlags.map(({ name }) => [name, form.get(name) === "on"])),
    collections: form.getAll("collections"),
  })
  if (!input.success) redirect(returnTo + "?result=invalid")
  const [categories, settings, existing] = await Promise.all([
    readGemCategories(db), readShopFilterSettings(db),
    id ? db.product.findFirst({ where: { id, archived_at: null, status: "available" } }) : null,
  ])
  if (!categories.some(({ slug }) => slug === input.data.gem_type)) redirect(returnTo + "?result=invalid")
  if (id && !existing) redirect(returnTo + "?result=unavailable")
  const { options } = shopFilterConfig(settings.rows, [], existing ? [existing] : [])
  if (!options.cut.some(({ value }) => value === normalizeShopOption(input.data.cut)) ||
    input.data.collections.some((collection) => !options.collection.some(({ value }) => value === collection))) {
    redirect(returnTo + "?result=invalid")
  }

  const file = form.get("photo")
  const hasPhoto = file instanceof File && file.size > 0
  if (id && hasPhoto) redirect(returnTo + "?result=photo-choice#product-photos")
  let newPhoto: string | null = null
  if (hasPhoto) {
    const upload = await uploadProductPhoto(file)
    if ("error" in upload) redirect(returnTo + "?result=" + upload.error)
    newPhoto = upload.url
  }
  try {
    if (id) {
      const { count } = await db.product.updateMany({
        where: { id, status: "available", archived_at: null }, data: input.data,
      })
      if (count === 0) throw new Error("Listing is no longer available")
    } else {
      await db.product.create({ data: { ...input.data, image_url: newPhoto } })
    }
  } catch (error) {
    if (newPhoto) {
      // Confirm an interrupted write did not save the uploaded photo.
      const saved = await db.product.findFirst({ where: { image_url: newPhoto }, select: { id: true } })
        .catch(() => undefined)
      if (saved === null) await discardProductPhoto(newPhoto)
    }
    redirect(returnTo + "?result=" + (isDuplicate(error) ? "duplicate" : "unavailable"))
  }
  refreshCatalogue()
  redirect("/admin?result=saved")
}

export async function editProductGallery(id: string, revision: string, operation: "add" | "cover" | "remove", photo: string | null, form: FormData) {
  const db = await requireAdminDatabase()
  if (!z.uuid().safeParse(id).success || !z.uuid().safeParse(revision).success) redirect("/admin")
  const url = (result: string) => "/admin/products/" + id + "?result=" + result + "#product-photos"
  const current = await db.product.findFirst({
    where: { id, status: "available", archived_at: null },
    select: { image_url: true, gallery_urls: true, gallery_revision: true },
  })
  if (!current || current.gallery_revision !== revision) redirect(url("photo-stale"))

  const photos = [current.image_url, ...current.gallery_urls].filter((entry): entry is string => Boolean(entry))
  let upload: string | null = null
  let removed: string | null = null
  if (operation === "add") {
    if (photos.length >= 8) redirect(url("photo-capacity"))
    const file = form.get("photo")
    if (!(file instanceof File) || !file.size) redirect(url("photo-invalid"))
    const result = await uploadProductPhoto(file)
    if (!result.url) redirect(url(result.error ?? "photo-failed"))
    upload = result.url
    photos.push(upload)
  } else {
    const index = photo ? photos.indexOf(photo) : -1
    if (index < 0 || (operation !== "cover" && operation !== "remove")) redirect(url("photo-stale"))
    const [selected] = photos.splice(index, 1)
    if (operation === "cover") photos.unshift(selected)
    else removed = selected
  }

  const result = await db.product.updateMany({
    data: { image_url: photos[0] ?? null, gallery_urls: photos.slice(1), gallery_revision: randomUUID() },
    where: { id, gallery_revision: revision, status: "available", archived_at: null },
  }).catch(() => null)
  if (!result?.count) {
    if (upload) {
      const stored = await db.product.findUnique({
        where: { id }, select: { image_url: true, gallery_urls: true },
      }).catch(() => undefined)
      if (stored !== undefined && stored?.image_url !== upload && !stored?.gallery_urls.includes(upload)) {
        await discardProductPhoto(upload)
      }
    }
    redirect(url("photo-stale"))
  }
  if (removed) await discardProductPhoto(removed)
  refreshCatalogue()
  redirect(url("photo-saved"))
}

export async function setProductVisibility(id: string, visible: boolean) {
  const db = await requireAdminDatabase()
  if (!z.uuid().safeParse(id).success || typeof visible !== "boolean") redirect("/admin")
  const result = await db.product.updateMany({
    where: { id, status: { not: "reserved" }, archived_at: null }, data: { is_published: visible },
  }).catch(() => null)
  if (result?.count) refreshCatalogue()
  redirect("/admin?result=" + (result?.count ? "saved" : "unavailable"))
}

export async function deleteProduct(id: string) {
  const db = await requireAdminDatabase()
  if (!z.uuid().safeParse(id).success) redirect("/admin")
  let count: number
  try {
    await expireCheckouts(db)
    const result = await db.product.updateMany({
      where: { id, status: "available", archived_at: null },
      data: { is_published: false, archived_at: new Date() },
    })
    count = result.count
  } catch {
    redirect("/admin?result=unavailable")
  }
  if (count) refreshCatalogue()
  redirect("/admin?result=" + (count ? "deleted" : "unavailable"))
}

function isDuplicate(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
}

const filtersUrl = "/admin?view=filters&result="

function refreshShopSettings() {
  updateTag(publicSettingsTag)
  refreshCatalogue()
}

export async function setCategoryVisibility(slug: string, visible: boolean) {
  const db = await requireAdminDatabase()
  const key = slugInput.safeParse(slug)
  if (!key.success || typeof visible !== "boolean") redirect(filtersUrl + "unavailable")
  const result = await db.gemCategory.updateMany({
    where: { slug: key.data }, data: { is_visible: visible },
  }).catch(() => null)
  if (result?.count) refreshShopSettings()
  redirect(filtersUrl + (result?.count ? "category-saved" : "unavailable"))
}

export async function addGemType(form: FormData) {
  const db = await requireAdminDatabase()
  const name = z.string().trim().min(1).max(80).safeParse(form.get("label"))
  if (!name.success) redirect(filtersUrl + "filter-invalid")
  const slug = slugInput.safeParse(customShopOption("type", name.data))
  if (!slug.success) redirect(filtersUrl + "filter-invalid")
  try {
    await db.gemCategory.create({ data: { slug: slug.data, name: name.data } })
  } catch (error) {
    redirect(filtersUrl + (isDuplicate(error) ? "filter-duplicate" : "unavailable"))
  }
  refreshShopSettings()
  redirect(filtersUrl + "gem-type-added")
}

const filterLabel = z.string().trim().min(1).max(120)
const filterOptionKeys = ["sort", ...configurableShopOptions] as const

export async function setShopFilterVisibility(key: string, value: string, visible: boolean) {
  const db = await requireAdminDatabase()
  if (!Object.hasOwn(shopFilterControls, key) || typeof value !== "string" || typeof visible !== "boolean") {
    redirect(filtersUrl + "unavailable")
  }
  const optionKey = filterOptionKeys.find((entry) => entry === key)
  let label = ""
  if (value) {
    if (!optionKey) redirect(filtersUrl + "unavailable")
    const { options } = await getStoneOptions()
    const choice = options[optionKey].find((option) => option.value === value)
    if (!choice) redirect(filtersUrl + "unavailable")
    label = choice.label
  }

  try {
    await db.shopFilterSetting.upsert({
      where: { filter_key_value: { filter_key: key, value } },
      create: { filter_key: key, value, label, is_visible: visible },
      update: { is_visible: visible },
    })
  } catch {
    redirect(filtersUrl + "unavailable")
  }
  refreshShopSettings()
  redirect(filtersUrl + "filter-saved")
}

export async function addShopFilterOption(key: string, form: FormData) {
  const db = await requireAdminDatabase()
  const optionKey = configurableShopOptions.find((entry) => entry === key)
  const label = filterLabel.safeParse(form.get("label"))
  if (!optionKey || !label.success) redirect(filtersUrl + "filter-invalid")
  const value = customShopOption(optionKey, label.data)
  if (!value || value.length > 120 || (optionKey === "collection" && !slugInput.safeParse(value).success)) {
    redirect(filtersUrl + "filter-invalid")
  }
  const { options } = await getStoneOptions()
  if (options[optionKey].some((option) => option.value === value)) redirect(filtersUrl + "filter-duplicate")
  try {
    await db.shopFilterSetting.create({ data: { filter_key: optionKey, value, label: label.data } })
  } catch (error) {
    redirect(filtersUrl + (isDuplicate(error) ? "filter-duplicate" : "unavailable"))
  }
  refreshShopSettings()
  redirect(filtersUrl + "filter-added")
}

export async function shipOrder(id: string) {
  const db = await requireAdminDatabase()
  if (!z.uuid().safeParse(id).success) redirect("/admin?view=orders")
  const result = await db.order.updateMany({
    where: { id, status: "paid" }, data: { status: "shipped", shipped_at: new Date() },
  }).catch(() => null)
  if (result?.count) revalidatePath("/admin")
  redirect("/admin?view=orders&result=" + (result?.count ? "shipped" : "unavailable"))
}

export async function readMessage(id: string) {
  const db = await requireAdminDatabase()
  if (!z.uuid().safeParse(id).success) redirect("/admin?view=inbox")
  const result = await db.inboxMessage.updateMany({
    where: { id, read_at: null }, data: { read_at: new Date() },
  }).catch(() => null)
  if (result?.count) revalidatePath("/admin")
  redirect("/admin?view=inbox&result=" + (result?.count ? "read" : "unavailable"))
}
