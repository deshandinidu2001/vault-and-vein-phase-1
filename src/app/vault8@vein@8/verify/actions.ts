"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { pendingAdminIdentity, sendAdminVerification, verifyAdminCode } from "@/lib/admin-auth"
import { permitRequest } from "@/lib/http"

async function verificationRequest(scope: string, email: string) {
  const request = new Request("http://internal/admin", { headers: await headers() })
  const allowed = await permitRequest(request, scope, email).catch(() => null)
  if (allowed !== true) redirect("/vault8@vein@8/verify?result=" + (allowed === false ? "limited" : "unavailable"))
}

export async function sendVerificationCode() {
  const { email } = await pendingAdminIdentity()
  await verificationRequest("admin-otp-send", email)
  const result = await sendAdminVerification(email).catch(() => "unavailable")
  redirect("/vault8@vein@8/verify?result=" + result)
}

export async function confirmVerificationCode(form: FormData) {
  const user = await pendingAdminIdentity()
  const code = form.get("code")
  if (typeof code !== "string" || !/^\d{6}$/.test(code.trim())) redirect("/vault8@vein@8/verify?result=invalid")
  await verificationRequest("admin-otp-verify", user.email)
  const result = await verifyAdminCode(user, code.trim()).catch(() => "unavailable")
  redirect(result === "verified" ? "/vault8@vein@8" : "/vault8@vein@8/verify?result=" + result)
}
