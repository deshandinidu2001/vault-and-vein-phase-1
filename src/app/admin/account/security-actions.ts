"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { adminIdentity, updateAdminPassword } from "@/lib/admin-auth"
import { permitRequest } from "@/lib/http"

async function permitPasswordChange(id: string) {
  const request = new Request("http://internal/admin", { headers: await headers() })
  try {
    return await permitRequest(request, "admin-password", id)
  } catch {
    return false
  }
}

export async function changePassword(form: FormData) {
  const { id } = await adminIdentity()
  const current = form.get("current")
  const password = form.get("password")
  if (typeof current !== "string" || !current || current.length > 128 ||
    typeof password !== "string" || password.length < 12 || password.length > 128 ||
    password === current || password !== form.get("confirm")) redirect("/admin/account?result=invalid")
  if (!await permitPasswordChange(id)) redirect("/admin/account?result=limited")
  let updated: boolean
  try {
    updated = await updateAdminPassword(id, current, password)
  } catch {
    redirect("/admin/account?result=failed")
  }
  if (!updated) redirect("/admin/account?result=denied")
  redirect("/admin/login?result=changed")
}
