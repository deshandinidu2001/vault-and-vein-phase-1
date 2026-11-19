"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { adminIdentity } from "@/lib/admin-auth"
import { publicDatabase } from "@/lib/backend"
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
  const { session, id, email } = await adminIdentity()
  const current = form.get("current")
  const password = form.get("password")
  if (!email || typeof current !== "string" || !current || current.length > 128 ||
    typeof password !== "string" || password.length < 12 || password.length > 128 ||
    password === current || password !== form.get("confirm")) redirect("/admin/account?result=invalid")
  if (!await permitPasswordChange(id)) redirect("/admin/account?result=limited")
  // Some projects do not enforce current_password. Verify proof independently
  // without overwriting the signed-in browser session.
  const proof = publicDatabase()
  const check = await proof.auth.signInWithPassword({ email, password: current })
  if (check.error || check.data.user?.id !== id) redirect("/admin/account?result=denied")
  await proof.auth.signOut({ scope: "local" })
  const { error } = await session.auth.updateUser({ password, current_password: current })
  if (error) redirect("/admin/account?result=failed")
  await session.auth.signOut({ scope: "global" })
  redirect("/admin/login?result=changed")
}
