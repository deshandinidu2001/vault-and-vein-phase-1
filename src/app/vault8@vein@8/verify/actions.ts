"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { requireAdminPasswordIdentity, sendAdminVerification, unlockAdminSession, verifyAdminCode } from "@/lib/admin-auth"
import { adminPinPattern, matchAdminPin, saveAdminPin, storeAdminEmail } from "@/lib/admin-pin"
import { permitRequest } from "@/lib/http"

const admin = "/vault8@vein@8"
const pinPage = admin + "/verify?result="
const resetPage = admin + "/verify?mode=reset&result="

async function verificationRequest(scope: string, returnTo: string) {
  const request = new Request("http://internal/admin", { headers: await headers() })
  const allowed = await permitRequest(request, scope, storeAdminEmail).catch(() => null)
  if (allowed !== true) redirect(returnTo + (allowed === false ? "limited" : "unavailable"))
}

export async function enterPin(form: FormData) {
  const session = await requireAdminPasswordIdentity()
  if (session.unlocked) redirect(admin)
  if (!session.revision) redirect(admin + "/verify?mode=reset")
  const pin = form.get("pin")
  if (typeof pin !== "string" || !adminPinPattern.test(pin)) redirect(pinPage + "wrong-pin")
  await verificationRequest("admin-pin-login", pinPage)
  const valid = await matchAdminPin(pin, session.revision).catch(() => null)
  if (valid !== true) redirect(pinPage + (valid === false ? "wrong-pin" : "unavailable"))
  await unlockAdminSession(session.revision)
  redirect(admin)
}

export async function sendVerificationCode() {
  const { email } = await requireAdminPasswordIdentity()
  await verificationRequest("admin-otp-send", resetPage)
  const result = await sendAdminVerification(email).catch(() => "unavailable")
  redirect(resetPage + result)
}

export async function setPinWithCode(form: FormData) {
  const session = await requireAdminPasswordIdentity()
  const pin = form.get("pin")
  const code = form.get("code")
  if (typeof pin !== "string" || !adminPinPattern.test(pin) || pin !== form.get("confirm")) {
    redirect(resetPage + "invalid-pin")
  }
  if (typeof code !== "string" || !/^\d{6}$/.test(code)) redirect(resetPage + "invalid")
  await verificationRequest("admin-otp-verify", resetPage)
  const result = await verifyAdminCode(session, code).catch(() => "unavailable")
  if (result !== "verified") redirect(resetPage + result)
  const revision = await saveAdminPin(pin, session.revision).catch(() => null)
  if (!revision) redirect(resetPage + "save-failed")
  await unlockAdminSession(revision)
  redirect(admin)
}
