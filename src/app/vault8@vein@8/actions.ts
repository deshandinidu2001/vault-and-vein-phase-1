"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath, updateTag } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { endAdminSession, requireAdminDatabase } from "@/lib/admin-auth"
import { Prisma } from "@/generated/prisma/client"
import { expireCheckouts } from "@/lib/checkout"
import { publicSettingsTag } from "@/lib/backend"
import { productFlags, productInput, slugInput } from "@/lib/admin-product"
import { readGemCategories } from "@/lib/gem-categories"
import { discardProductPhoto, uploadProductPhotos } from "@/lib/cloudinary"
import { maxProductPhotos } from "@/lib/product-photo"
import { getStoneOptions } from "@/lib/data"
import { configurableShopOptions, customShopOption, normalizeShopOption, shopFilterConfig, shopFilterControls } from "@/lib/shop-filter-config"
import { readShopFilterSettings } from "@/lib/shop-filter-settings"

function refreshCatalogue() {
  revalidatePath("/vault8@vein@8")
  revalidatePath("/")
  revalidatePath("/shop")
  revalidatePath("/shop/[slug]", "page")
}

export async function signOut() {
  await endAdminSession()
  redirect("/vault8@vein@8/login")
}

function selectedPhotos(form: FormData) {
  return form.getAll("photo").filter((entry): entry is File => entry instanceof File && entry.name !== "")
}

export async function saveProduct(id: string | null, form: FormData) {
  const db = await requireAdminDatabase()
  if (id !== null && !z.uuid().safeParse(id).success) redirect("/vault8@vein@8")
  const returnTo = id ? "/vault8@vein@8/products/" + id : "/vault8@vein@8/products/new"
  const input = productInput.safeParse({
    ...Object.fromEntries(form),
    ...Object.fromEntries(productFlags.map(({ name }) => [name, form.get(name) === "on"])),
    collections: form.getAll("collections"),
  })
  if (!input.success) redirect(returnTo + "?result=invalid")
  const [categories, settings, existing] = await Promise.all([
    readGemCategories(db), readShopFilterSettings(db),
    id ? db.product.findFirst({ where: { id, archived_at: null, is_sample: false, status: "available" } }) : null,
  ])
  if (!categories.some(({ slug }) => slug === input.data.gem_type)) redirect(returnTo + "?result=invalid")
  if (id && !existing) redirect(returnTo + "?result=unavailable")
  const { options } = shopFilterConfig(settings.rows, [], existing ? [existing] : [])
  if (!options.cut.some(({ value }) => value === normalizeShopOption(input.data.cut)) ||
    input.data.collections.some((collection) => !options.collection.some(({ value }) => value === collection))) {
    redirect(returnTo + "?result=invalid")
  }

  const files = selectedPhotos(form)
  if (id && files.length) redirect(returnTo + "?result=photo-choice#product-photos")
  const upload = await uploadProductPhotos(files, maxProductPhotos)
  if ("error" in upload) redirect(returnTo + "?result=" + upload.error)
  const photos = upload.urls
  try {
    if (id) {
      const { count } = await db.product.updateMany({
        where: { id, status: "available", archived_at: null, is_sample: false }, data: input.data,
      })
      if (count === 0) throw new Error("Listing is no longer available")
    } else {
      await db.product.create({
        data: { ...input.data, image_url: photos[0] ?? null, gallery_urls: photos.slice(1), tint: "#28654f" },
      })
    }
  } catch (error) {
    if (photos.length) {
      // Confirm an interrupted write did not save the uploaded photos.
      const saved = await db.product.findFirst({ where: { image_url: { in: photos } }, select: { id: true } })
        .catch(() => undefined)
      if (saved === null) await Promise.all(photos.map(discardProductPhoto))
    }
    redirect(returnTo + "?result=" + (isDuplicate(error) ? "duplicate" : "unavailable"))
  }
  refreshCatalogue()
  redirect("/vault8@vein@8?result=saved")
}

export async function editProductGallery(id: string, revision: string, operation: "add" | "cover" | "remove", photo: string | null, form: FormData) {
  const db = await requireAdminDatabase()
  if (!z.uuid().safeParse(id).success || !z.uuid().safeParse(revision).success) redirect("/vault8@vein@8")
  const url = (result: string) => "/vault8@vein@8/products/" + id + "?result=" + result + "#product-photos"
  const current = await db.product.findFirst({
    where: { id, status: "available", archived_at: null, is_sample: false },
    select: { image_url: true, gallery_urls: true, gallery_revision: true },
  })
  if (!current || current.gallery_revision !== revision) redirect(url("photo-stale"))

  const photos = [current.image_url, ...current.gallery_urls].filter((entry): entry is string => Boolean(entry))
  let uploaded: string[] = []
  let removed: string | null = null
  if (operation === "add") {
    const files = selectedPhotos(form)
    if (files.length === 0) redirect(url("photo-invalid"))
    const result = await uploadProductPhotos(files, maxProductPhotos - photos.length)
    if ("error" in result) redirect(url(result.error))
    uploaded = result.urls
    photos.push(...uploaded)
  } else {
    const index = photo ? photos.indexOf(photo) : -1
    if (index < 0 || (operation !== "cover" && operation !== "remove")) redirect(url("photo-stale"))
    const [selected] = photos.splice(index, 1)
    if (operation === "cover") photos.unshift(selected)
    else removed = selected
  }

  const result = await db.product.updateMany({
    data: { image_url: photos[0] ?? null, gallery_urls: photos.slice(1), gallery_revision: randomUUID() },
    where: { id, gallery_revision: revision, status: "available", archived_at: null, is_sample: false },
  }).catch(() => null)
  if (!result?.count) {
    if (uploaded.length) {
      const stored = await db.product.findUnique({
        where: { id }, select: { image_url: true, gallery_urls: true },
      }).catch(() => undefined)
      if (stored !== undefined) {
        const unused = uploaded.filter((image) => stored?.image_url !== image && !stored?.gallery_urls.includes(image))
        await Promise.all(unused.map(discardProductPhoto))
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
  if (!z.uuid().safeParse(id).success || typeof visible !== "boolean") redirect("/vault8@vein@8")
  const result = await db.product.updateMany({
    where: { id, status: { not: "reserved" }, archived_at: null, is_sample: false }, data: { is_published: visible },
  }).catch(() => null)
  if (result?.count) refreshCatalogue()
  redirect("/vault8@vein@8?result=" + (result?.count ? "saved" : "unavailable"))
}

export async function deleteProduct(id: string) {
  const db = await requireAdminDatabase()
  if (!z.uuid().safeParse(id).success) redirect("/vault8@vein@8")
  let count: number
  try {
    await expireCheckouts(db)
    const result = await db.product.updateMany({
      where: { id, status: "available", archived_at: null },
      data: { is_published: false, archived_at: new Date() },
    })
    count = result.count
  } catch {
    redirect("/vault8@vein@8?result=unavailable")
  }
  if (count) refreshCatalogue()
  redirect("/vault8@vein@8?result=" + (count ? "deleted" : "unavailable"))
}

function isDuplicate(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
}

const filtersUrl = "/vault8@vein@8?view=filters&result="

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
  if (!z.uuid().safeParse(id).success) redirect("/vault8@vein@8?view=orders")
  const result = await db.order.updateMany({
    where: { id, status: "paid" }, data: { status: "shipped", shipped_at: new Date() },
  }).catch(() => null)
  if (result?.count) revalidatePath("/vault8@vein@8")
  redirect("/vault8@vein@8?view=orders&result=" + (result?.count ? "shipped" : "unavailable"))
}

export async function readMessage(id: string) {
  const db = await requireAdminDatabase()
  if (!z.uuid().safeParse(id).success) redirect("/vault8@vein@8?view=inbox")
  const result = await db.inboxMessage.updateMany({
    where: { id, read_at: null }, data: { read_at: new Date() },
  }).catch(() => null)
  if (result?.count) revalidatePath("/vault8@vein@8")
  redirect("/vault8@vein@8?view=inbox&result=" + (result?.count ? "read" : "unavailable"))
}
