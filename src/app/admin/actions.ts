"use server"

import { randomUUID } from "node:crypto"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { adminSession, hasAdminAccess, requireAdminDatabase } from "@/lib/admin-auth"
import { backendConfigured } from "@/lib/backend"
import { productFlags, productInput, slugInput } from "@/lib/admin-product"
import { isMissingInventorySchema, readGemCategories } from "@/lib/gem-categories"
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
  if (!backendConfigured) redirect("/admin/login")
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
  const session = await adminSession()
  const { data: { user }, error } = await session.auth.signInWithPassword(input.data)
  if (error || !user || !await hasAdminAccess(user.id)) {
    if (user) await session.auth.signOut({ scope: "local" })
    redirect("/admin/login?result=denied")
  }
  redirect("/admin")
}

export async function signOut() {
  if (backendConfigured) await (await adminSession()).auth.signOut({ scope: "local" })
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
  const [{ categories, inventoryReady, visibilityReady }, settings] = await Promise.all([readGemCategories(db), readShopFilterSettings(db)])
  if (!categories.some(({ slug }) => slug === input.data.gem_type)) redirect(returnTo + "?result=invalid")

  const existingOptions = id ? await db.from("products").select("*").eq("id", id).maybeSingle() : null
  if (existingOptions && (existingOptions.error || !existingOptions.data)) redirect(returnTo + "?result=unavailable")
  const { options } = shopFilterConfig(settings.rows, [], existingOptions?.data ? [existingOptions.data] : [])
  if (!options.cut.some(({ value }) => value === normalizeShopOption(input.data.cut)) ||
    input.data.collections.some((collection) => !options.collection.some(({ value }) => value === collection))) {
    redirect(returnTo + "?result=invalid")
  }

  const file = form.get("photo")
  const hasPhoto = file instanceof File && file.size > 0
  const removePhoto = form.get("remove_photo") === "on"
  const changePhoto = hasPhoto || removePhoto
  let previousPhoto: string | null = null
  let newPhoto: string | null = null
  if (changePhoto) {
    if (!visibilityReady) redirect(returnTo + "?result=photo-schema")
    if (existingOptions?.data?.gallery_revision) redirect(returnTo + "?result=photo-choice#product-photos")
    if (hasPhoto && removePhoto) redirect(returnTo + "?result=photo-choice")
    if (id) {
      const existing = await db.from("products").select("image_url").eq("id", id).eq("status", "available")
        .is("archived_at", null).maybeSingle()
      if (existing.error || !existing.data) redirect(returnTo + "?result=unavailable")
      previousPhoto = existing.data.image_url
    }
    if (hasPhoto) {
      const upload = await uploadProductPhoto(file)
      if ("error" in upload) redirect(returnTo + "?result=" + upload.error)
      newPhoto = upload.url
    }
  }

  const values = changePhoto ? { ...input.data, image_url: newPhoto } : input.data
  const product = id ? db.from("products").update(values).eq("id", id).eq("status", "available") : db.from("products").insert(values)
  if (id && inventoryReady) product.is("archived_at", null)
  if (id && changePhoto) {
    if (previousPhoto) product.eq("image_url", previousPhoto)
    else product.is("image_url", null)
  }
  const result = await product.select("id").maybeSingle()
  if (newPhoto && (result.error || !result.data)) {
    // Check for an ambiguous write before deleting an upload that may have been saved.
    const stored = await db.from("products").select("id").eq("image_url", newPhoto).maybeSingle()
    if (!stored.error && !stored.data) await discardProductPhoto(newPhoto)
  }
  if (result.error?.code === "23505") redirect(returnTo + "?result=duplicate")
  if (result.error || !result.data) redirect(returnTo + "?result=unavailable")
  if (changePhoto && previousPhoto) await discardProductPhoto(previousPhoto)
  refreshCatalogue()
  redirect("/admin?result=saved")
}

export async function editProductGallery(id: string, revision: string, operation: "add" | "cover" | "remove", photo: string | null, form: FormData) {
  const db = await requireAdminDatabase()
  if (!z.uuid().safeParse(id).success || !z.uuid().safeParse(revision).success) redirect("/admin")
  const url = (result: string) => "/admin/products/" + id + "?result=" + result + "#product-photos"
  const current = await db.from("products").select("image_url,gallery_urls,gallery_revision").eq("id", id)
    .eq("status", "available").is("archived_at", null).maybeSingle()
  if (isMissingInventorySchema(current.error)) redirect(url("gallery-schema"))
  if (current.error || !current.data || current.data.gallery_revision !== revision) redirect(url("photo-stale"))

  const photos: string[] = [current.data.image_url, ...current.data.gallery_urls].filter(Boolean)
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

  const { data, error } = await db.from("products")
    .update({ image_url: photos[0] ?? null, gallery_urls: photos.slice(1), gallery_revision: randomUUID() })
    .eq("id", id).eq("gallery_revision", revision).eq("status", "available").is("archived_at", null)
    .select("id").maybeSingle()
  if (error || !data) {
    if (upload) {
      // An interrupted response can follow a successful write.
      const stored = await db.from("products").select("image_url,gallery_urls").eq("id", id).maybeSingle()
      if (!stored.error && stored.data?.image_url !== upload && !stored.data?.gallery_urls?.includes(upload)) {
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
  const { inventoryReady } = await readGemCategories(db)
  const product = db.from("products").update({ is_published: visible }).eq("id", id).neq("status", "reserved")
  const { data, error } = await (inventoryReady ? product.is("archived_at", null) : product).select("id").maybeSingle()
  if (!error && data) refreshCatalogue()
  redirect("/admin?result=" + (error || !data ? "unavailable" : "saved"))
}

export async function deleteProduct(id: string) {
  const db = await requireAdminDatabase()
  if (!z.uuid().safeParse(id).success) redirect("/admin")
  const { error: expireError } = await db.rpc("expire_checkouts")
  if (expireError) redirect("/admin?result=unavailable")
  const { data, error } = await db.from("products").update({ is_published: false, archived_at: new Date().toISOString() })
    .eq("id", id).eq("status", "available").is("archived_at", null).select("id").maybeSingle()
  if (!error && data) refreshCatalogue()
  redirect("/admin?result=" + (isMissingInventorySchema(error) ? "migration" : error || !data ? "unavailable" : "deleted"))
}

const filtersUrl = "/admin?view=filters&result="

export async function setCategoryVisibility(slug: string, visible: boolean) {
  const db = await requireAdminDatabase()
  const key = slugInput.safeParse(slug)
  if (!key.success || typeof visible !== "boolean") redirect(filtersUrl + "unavailable")
  const { data, error } = await db.from("gem_categories").update({ is_visible: visible }).eq("slug", key.data).select("slug").maybeSingle()
  if (!error && data) refreshCatalogue()
  redirect(filtersUrl + (isMissingInventorySchema(error) ? "migration" : error || !data ? "unavailable" : "category-saved"))
}

export async function addGemType(form: FormData) {
  const db = await requireAdminDatabase()
  const name = z.string().trim().min(1).max(80).safeParse(form.get("label"))
  if (!name.success) redirect(filtersUrl + "filter-invalid")
  const slug = slugInput.safeParse(customShopOption("type", name.data))
  if (!slug.success) redirect(filtersUrl + "filter-invalid")
  const { error } = await db.from("gem_categories").insert({ slug: slug.data, name: name.data })
  if (!error) refreshCatalogue()
  redirect(filtersUrl + (error?.code === "23505" ? "filter-duplicate"
    : error?.code === "42501" || isMissingInventorySchema(error) ? "gallery-migration"
      : error ? "unavailable" : "gem-type-added"))
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

  const saveVisibility = () => db.from("shop_filter_settings").update({ is_visible: visible })
    .eq("filter_key", key).eq("value", value).select("filter_key").maybeSingle()
  let result = await saveVisibility()
  if (!result.error && !result.data) {
    result = await db.from("shop_filter_settings").insert({ filter_key: key, value, label, is_visible: visible })
      .select("filter_key").maybeSingle()
    if (result.error?.code === "23505") result = await saveVisibility()
  }
  if (!result.error && result.data) refreshCatalogue()
  redirect(filtersUrl + (isMissingInventorySchema(result.error) ? "filter-migration" : result.error || !result.data ? "unavailable" : "filter-saved"))
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
  const { ready, options } = await getStoneOptions()
  if (!ready) redirect(filtersUrl + "filter-migration")
  if (options[optionKey].some((option) => option.value === value)) redirect(filtersUrl + "filter-duplicate")
  const { error } = await db.from("shop_filter_settings").insert({ filter_key: optionKey, value, label: label.data })
  if (!error) refreshCatalogue()
  redirect(filtersUrl + (error?.code === "23505" ? "filter-duplicate" : error ? "unavailable" : "filter-added"))
}

export async function shipOrder(id: string) {
  const db = await requireAdminDatabase()
  if (!z.uuid().safeParse(id).success) redirect("/admin?view=orders")
  const { data, error } = await db.from("orders").update({ status: "shipped", shipped_at: new Date().toISOString() })
    .eq("id", id).eq("status", "paid").select("id").maybeSingle()
  if (!error && data) revalidatePath("/admin")
  redirect("/admin?view=orders&result=" + (error || !data ? "unavailable" : "shipped"))
}

export async function readMessage(id: string) {
  const db = await requireAdminDatabase()
  if (!z.uuid().safeParse(id).success) redirect("/admin?view=inbox")
  const { data, error } = await db.from("inbox").update({ read_at: new Date().toISOString() })
    .eq("id", id).is("read_at", null).select("id").maybeSingle()
  if (!error && data) revalidatePath("/admin")
  redirect("/admin?view=inbox&result=" + (error || !data ? "unavailable" : "read"))
}
