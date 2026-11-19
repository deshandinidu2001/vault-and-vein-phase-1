"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { adminSession, hasAdminAccess, requireAdminDatabase } from "@/lib/admin-auth"
import { backendConfigured } from "@/lib/backend"
import { categoryNameInput, productFlags, productInput, slugInput } from "@/lib/admin-product"
import { getGemCategories, isMissingInventorySchema } from "@/lib/gem-categories"
import { permitRequest } from "@/lib/http"

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
  const { categories, editable } = await getGemCategories()
  if (!categories.some(({ slug }) => slug === input.data.gem_type)) redirect(returnTo + "?result=invalid")

  const product = id ? db.from("products").update(input.data).eq("id", id).eq("status", "available") : db.from("products").insert(input.data)
  if (id && editable) product.is("archived_at", null)
  const result = await product.select("id").maybeSingle()
  if (result.error?.code === "23505") redirect(returnTo + "?result=duplicate")
  if (result.error || !result.data) redirect(returnTo + "?result=unavailable")
  refreshCatalogue()
  redirect("/admin?result=saved")
}

export async function setProductVisibility(id: string, visible: boolean) {
  const db = await requireAdminDatabase()
  if (!z.uuid().safeParse(id).success || typeof visible !== "boolean") redirect("/admin")
  const { editable } = await getGemCategories()
  const product = db.from("products").update({ is_published: visible }).eq("id", id).neq("status", "reserved")
  const { data, error } = await (editable ? product.is("archived_at", null) : product).select("id").maybeSingle()
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

export async function saveCategory(slug: string | null, form: FormData) {
  const db = await requireAdminDatabase()
  const url = "/admin?view=categories&result="
  const key = slugInput.safeParse(slug ?? form.get("slug"))
  const name = categoryNameInput.safeParse(form.get("name"))
  if (!key.success || !name.success) redirect(url + "category-invalid")
  const { data, error } = await (slug === null
    ? db.from("gem_categories").insert({ slug: key.data, name: name.data })
    : db.from("gem_categories").update({ name: name.data }).eq("slug", key.data)
  ).select("slug").maybeSingle()
  if (error?.code === "23505") redirect(url + "category-duplicate")
  if (!error && data) refreshCatalogue()
  redirect(url + (isMissingInventorySchema(error) ? "migration" : error || !data ? "unavailable" : "category-saved"))
}

export async function deleteCategory(slug: string) {
  const db = await requireAdminDatabase()
  const key = slugInput.safeParse(slug)
  const url = "/admin?view=categories&result="
  if (!key.success) redirect(url + "category-invalid")
  const { data, error } = await db.from("gem_categories").delete().eq("slug", key.data).eq("is_builtin", false).select("slug").maybeSingle()
  if (error?.code === "23503") redirect(url + "category-in-use")
  if (!error && data) refreshCatalogue()
  redirect(url + (isMissingInventorySchema(error) ? "migration" : error || !data ? "unavailable" : "category-deleted"))
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
