"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod"
import { adminSession, hasAdminAccess, requireAdminDatabase } from "@/lib/admin-auth"
import { backendConfigured } from "@/lib/backend"
import { productFlags, productInput } from "@/lib/admin-product"
import { permitRequest } from "@/lib/http"

const credentials = z.object({ email: z.email().max(254), password: z.string().min(1).max(128) })

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

  const result = id
    ? await db.from("products").update(input.data).eq("id", id).eq("status", "available").select("id").maybeSingle()
    : await db.from("products").insert(input.data).select("id").single()
  if (result.error?.code === "23505") redirect(returnTo + "?result=duplicate")
  if (result.error || !result.data) redirect(returnTo + "?result=unavailable")
  redirect("/admin?result=saved")
}

export async function setProductVisibility(id: string, visible: boolean) {
  const db = await requireAdminDatabase()
  if (!z.uuid().safeParse(id).success || typeof visible !== "boolean") redirect("/admin")
  const { data, error } = await db.from("products").update({ is_published: visible })
    .eq("id", id).neq("status", "reserved").select("id").maybeSingle()
  redirect("/admin?result=" + (error || !data ? "unavailable" : "saved"))
}

export async function shipOrder(id: string) {
  const db = await requireAdminDatabase()
  if (!z.uuid().safeParse(id).success) redirect("/admin?view=orders")
  const { data, error } = await db.from("orders").update({ status: "shipped", shipped_at: new Date().toISOString() })
    .eq("id", id).eq("status", "paid").select("id").maybeSingle()
  redirect("/admin?view=orders&result=" + (error || !data ? "unavailable" : "shipped"))
}

export async function readMessage(id: string) {
  const db = await requireAdminDatabase()
  if (!z.uuid().safeParse(id).success) redirect("/admin?view=inbox")
  const { data, error } = await db.from("inbox").update({ read_at: new Date().toISOString() })
    .eq("id", id).is("read_at", null).select("id").maybeSingle()
  redirect("/admin?view=inbox&result=" + (error || !data ? "unavailable" : "read"))
}
