"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod"
import { adminIdentity } from "@/lib/admin-auth"
import { publicDatabase } from "@/lib/backend"
import { permitRequest } from "@/lib/http"

async function permitted(id: string, scope: string) {
  const request = new Request("http://internal/admin", { headers: await headers() })
  try {
    return await permitRequest(request, scope, id)
  } catch {
    return false
  }
}

export type ChallengeState = { factor?: string; challenge?: string; error?: string }
export async function sendChallenge(_previous: ChallengeState, form: FormData): Promise<ChallengeState> {
  const { session, verified, id } = await adminIdentity()
  if (verified) redirect("/admin")
  if (!await permitted(id, "admin-mfa-send")) return { error: "Please wait before requesting another code." }
  const { data: { user }, error } = await session.auth.getUser()
  if (error || user?.id !== id) redirect("/admin/login")
  const factors = user.factors ?? []
  const enrolled = factors.filter(f => f.status === "verified")
  const factor = enrolled.find(f => f.id === form.get("factor") && (f.factor_type === "phone" || f.factor_type === "totp"))
  let factorId = factor?.id
  if (!enrolled.length) {
    const phone = String(form.get("phone") ?? "").trim()
    if (!/^\+[1-9]\d{6,14}$/.test(phone)) return { error: "Enter a phone number with its country code, starting with +." }
    // Only incomplete enrollments can be replaced here. Supabase requires
    // the existing factor for accounts that already have one.
    for (const pending of factors.filter(f => f.factor_type === "phone" && f.status === "unverified")) {
      if ((await session.auth.mfa.unenroll({ factorId: pending.id })).error) return { error: "Could not restart verification. Please try again." }
    }
    const result = await session.auth.mfa.enroll({ factorType: "phone", phone })
    if (result.error) return { error: "SMS enrollment is unavailable. Ask the store owner to check the Supabase phone MFA settings." }
    factorId = result.data.id
  }
  if (!factorId) return { error: "Choose an enrolled verification method." }
  const challenge = await session.auth.mfa.challenge({ factorId, ...(factor?.factor_type !== "totp" && { channel: "sms" as const }) })
  return challenge.error ? { error: "Could not start verification. Please try again." }
    : { factor: factorId, challenge: challenge.data.id }
}

export async function verifyCode(previous: ChallengeState, form: FormData): Promise<ChallengeState> {
  const { session, verified, id } = await adminIdentity()
  if (verified) redirect("/admin")
  const { factor, challenge } = previous
  if (!z.uuid().safeParse(factor).success || !z.uuid().safeParse(challenge).success) return { error: "Request a new code." }
  const code = String(form.get("code") ?? "")
  const retry = { factor, challenge, error: "Verification failed. Check the code or request another." }
  if (!/^\d{6}$/.test(code)) return retry
  if (!await permitted(id, "admin-mfa-verify")) return { factor, challenge, error: "Too many attempts. Please wait before trying again." }
  // GoTrue binds both IDs and the expiring, single-use code to this authenticated user.
  const { error } = await session.auth.mfa.verify({ factorId: factor!, challengeId: challenge!, code })
  if (error) return retry
  redirect("/admin")
}

export async function changePassword(form: FormData) {
  const { session, verified, id, email } = await adminIdentity()
  if (!verified) redirect("/admin/verify")
  const current = form.get("current")
  const password = form.get("password")
  if (!email || typeof current !== "string" || !current || current.length > 128 ||
    typeof password !== "string" || password.length < 12 || password.length > 128 ||
    password === current || password !== form.get("confirm")) redirect("/admin/account?result=invalid")
  if (!await permitted(id, "admin-password")) redirect("/admin/account?result=limited")
  // Some projects do not enforce current_password. Verify proof independently
  // without overwriting the MFA-authenticated browser session.
  const proof = publicDatabase()
  const check = await proof.auth.signInWithPassword({ email, password: current })
  if (check.error || check.data.user?.id !== id) redirect("/admin/account?result=denied")
  await proof.auth.signOut({ scope: "local" })
  const { error } = await session.auth.updateUser({ password, current_password: current })
  if (error) redirect("/admin/account?result=failed")
  await session.auth.signOut({ scope: "global" })
  redirect("/admin/login?result=changed")
}
