"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { adminAuthConfigured, signInAdminWithPassword, sendAdminPasswordReset, resetAdminPassword } from "@/lib/admin-auth"
import { storeAdminEmail } from "@/lib/admin-pin"
import { permitRequest } from "@/lib/http"

const login = "/vault8@vein@8/login"
const recovery = "/vault8@vein@8/reset-password"

async function permitAdminAuth(scope: string, returnTo: string) {
  if (!adminAuthConfigured) redirect(login)
  const request = new Request("http://internal/admin", { headers: await headers() })
  const allowed = await permitRequest(request, scope, storeAdminEmail).catch(() => null)
  if (allowed !== true) redirect(returnTo + "?result=" + (allowed === false ? "limited" : "unavailable"))
}

export async function signInWithPassword(form: FormData) {
  const email = form.get("email")
  const password = form.get("password")
  if (typeof email !== "string" || email.trim().toLowerCase() !== storeAdminEmail ||
    typeof password !== "string" || !password || password.length > 128) redirect(login + "?result=invalid")

  await permitAdminAuth("admin-password-login", login)
  const result = await signInAdminWithPassword(password).catch(() => "unavailable")
  redirect(result === "signed-in" ? "/vault8@vein@8/verify" : login + "?result=" + result)
}

export async function sendPasswordResetCode() {
  await permitAdminAuth("admin-password-reset-send", recovery)
  const result = await sendAdminPasswordReset().catch(() => "unavailable")
  redirect(recovery + "?result=" + result)
}

export async function resetPasswordWithCode(form: FormData) {
  const otp = form.get("code")
  const password = form.get("password")
  if (typeof password !== "string" || password.length < 12 || password.length > 128 ||
    password !== form.get("confirm")) redirect(recovery + "?result=password")
  if (typeof otp !== "string" || !/^\d{6}$/.test(otp)) redirect(recovery + "?result=invalid")

  await permitAdminAuth("admin-password-reset-verify", recovery)
  const result = await resetAdminPassword(otp, password).catch(() => "unavailable")
  redirect(result === "changed" ? login + "?result=changed" : recovery + "?result=" + result)
}
