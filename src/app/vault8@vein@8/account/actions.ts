"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { adminIdentity, changeAdminPassword } from "@/lib/admin-auth"
import { permitRequest } from "@/lib/http"

const account = "/vault8@vein@8/account?result="

export async function updatePassword(form: FormData) {
  const { email } = await adminIdentity()
  const current = form.get("current")
  const password = form.get("password")
  if (typeof current !== "string" || !current || current.length > 128 ||
    typeof password !== "string" || password.length < 12 || password.length > 128 ||
    password !== form.get("confirm")) redirect(account + "password")

  const request = new Request("http://internal/admin", { headers: await headers() })
  const allowed = await permitRequest(request, "admin-password-change", email).catch(() => null)
  if (allowed !== true) redirect(account + (allowed === false ? "limited" : "unavailable"))

  const result = await changeAdminPassword(current, password).catch(() => "unavailable")
  redirect(result === "changed" ? "/vault8@vein@8/login?result=changed" : account + result)
}
