import "server-only"
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto"
import { createNeonAuth } from "@neon/auth/next/server"
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { NextResponse } from "next/server"
import { cache } from "react"
import { z } from "zod"
import { backendConfigured, database } from "./backend"
import { adminPinRevision, storeAdminEmail } from "./admin-pin"

const baseUrl = process.env.NEON_AUTH_BASE_URL
const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET
const authUrl = baseUrl && URL.canParse(baseUrl) ? new URL(baseUrl) : null
const validAuthUrl = authUrl && (authUrl.protocol === "https:" ||
  (process.env.NODE_ENV === "development" && authUrl.protocol === "http:" && authUrl.hostname === "127.0.0.1"))
export const adminAuthConfigured = Boolean(backendConfigured && validAuthUrl &&
  cookieSecret && cookieSecret.length >= 32)

const sessionCookie = "__Secure-neon-auth.session_token"
const sessionDataCookie = "__Secure-neon-auth.local.session_data"
const passwordCookie = "__Host-vault-admin-password"
const unlockedCookie = "__Host-vault-admin-pin"
const retiredCookies = ["__Host-vault-admin-verified", "__Host-vault-admin-oauth", "__Host-vault-admin-google"]
const adminLifetime = 8 * 60 * 60
const cookieOptions = { path: "/", httpOnly: true, secure: true, sameSite: "lax" } as const
let neonAuth: ReturnType<typeof createNeonAuth> | undefined

function auth() {
  if (!adminAuthConfigured || !authUrl || !cookieSecret) throw new Error("Neon admin sign-in is not configured")
  return neonAuth ??= createNeonAuth({
    baseUrl: authUrl.href.replace(/\/$/, ""),
    cookies: { secret: cookieSecret, sameSite: "lax" },
  })
}

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex")
}

function signProof(name: string, token: string, expires: number) {
  if (!cookieSecret) throw new Error("Admin cookie secret is missing")
  return createHmac("sha256", cookieSecret).update(JSON.stringify([name, token, expires])).digest("base64url")
}

function issueProof(name: string, token: string, lifetime: number) {
  const expires = Math.floor(Date.now() / 1000) + lifetime
  return expires + "." + signProof(name, token, expires)
}

function validProof(name: string, proof: string | undefined, token: string) {
  const match = /^(\d{1,12})\.([a-zA-Z0-9_-]{43})$/.exec(proof ?? "")
  if (!match || Number(match[1]) <= Math.floor(Date.now() / 1000)) return false
  return timingSafeEqual(Buffer.from(match[2]), Buffer.from(signProof(name, token, Number(match[1]))))
}

export async function signInAdminWithPassword(password: string) {
  const store = await cookies()
  const { data, error } = await auth().signIn.email({ email: storeAdminEmail, password, rememberMe: false })
  if (error?.status === 429) return "limited"
  if (error && (error.status >= 500 || error.code === "INVALID_ORIGIN")) return "unavailable"
  if (error || !data?.user) return "invalid"
  const token = store.get(sessionCookie)?.value
  if (!token || data.user.email.toLowerCase() !== storeAdminEmail || !data.user.emailVerified) {
    await endAdminSession()
    return "invalid"
  }
  await lockAdminSession()
  store.set(passwordCookie, issueProof(passwordCookie, token, adminLifetime), {
    ...cookieOptions, sameSite: "strict", maxAge: adminLifetime,
  })
  return "signed-in"
}

export async function changeAdminPassword(currentPassword: string, newPassword: string) {
  await adminIdentity()
  const { data, error } = await auth().changePassword({ currentPassword, newPassword, revokeOtherSessions: true })
  if (error?.status === 429) return "limited"
  if (error && error.status >= 500) return "unavailable"
  if (error || !data?.user) return "invalid"
  await endAdminSession()
  return "changed"
}

const adminSession = cache(async () => {
  if (!adminAuthConfigured) return null
  const store = await cookies()
  const token = store.get(sessionCookie)?.value
  if (!token) return null
  const proof = store.get(unlockedCookie)?.value
  if (!validProof(passwordCookie, store.get(passwordCookie)?.value, token)) return null

  // Check Neon on each request so an expired or revoked session cannot grant admin access.
  const { data, error } = await auth().getSession({ query: { disableCookieCache: "true", disableRefresh: "true" } })
  if (error || !data?.session || !data.user) return null
  const { id, email, emailVerified } = data.user
  const approved = emailVerified === true && email.toLowerCase() === storeAdminEmail
  const revision = approved ? await adminPinRevision() : null
  const signed = proof?.split("~")[0]
  const unlocked = Boolean(revision && proof && validProof(unlockedCookie + ":" + revision, signed, token) &&
    await database().adminUnlock.count({ where: {
      session_hash: digest(token), proof_hash: digest(proof), expires_at: { gt: new Date() },
    } }))
  if (proof && !unlocked) return null
  return { id, email, approved, unlocked, revision }
})

export async function continueAdminSignIn() {
  const session = await adminSession()
  if (session?.approved) redirect(session.unlocked ? "/vault8@vein@8" : "/vault8@vein@8/verify")
}

export async function requireAdminPasswordIdentity() {
  const session = await adminSession()
  if (!session) redirect("/vault8@vein@8/login")
  if (!session.approved) redirect("/vault8@vein@8/login?result=denied")
  return session
}

async function emailOtp(path: string[], body: object) {
  // The SDK proxy supports the Email OTP endpoints, including on versions without typed server helpers.
  const incoming = await headers()
  const origin = incoming.get("origin")
  if (!origin || !URL.canParse(origin)) throw new Error("Missing verification request origin")
  const request = new Request(new URL("/vault8@vein@8/verify", origin), {
    method: "POST",
    headers: { Origin: origin, Cookie: incoming.get("cookie") ?? "", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return auth().handler().POST(request, { params: Promise.resolve({ path }) })
}

export async function sendAdminPasswordReset() {
  const response = await emailOtp(["forget-password", "email-otp"], { email: storeAdminEmail })
  if (response.status === 429) return "limited"
  return response.ok ? "sent" : "unavailable"
}

export async function resetAdminPassword(otp: string, password: string) {
  const response = await emailOtp(["email-otp", "reset-password"], { email: storeAdminEmail, otp, password })
  if (response.status === 429) return "limited"
  if (response.status >= 500) return "unavailable"
  const result = z.object({ success: z.literal(true) }).safeParse(await response.json())
  if (!response.ok || !result.success) return "invalid"
  await endAdminSession()
  return "changed"
}

export async function sendAdminVerification(email: string) {
  const response = await emailOtp(["email-otp", "send-verification-otp"], { email, type: "email-verification" })
  if (response.status === 429) return "limited"
  const data = z.object({ success: z.literal(true) }).safeParse(await response.json())
  return response.ok && data.success ? "sent" : "unavailable"
}

export async function verifyAdminCode(user: { id: string; email: string }, code: string) {
  const response = await emailOtp(["email-otp", "verify-email"], { email: user.email, otp: code })
  if (response.status === 429) return "limited"
  if (response.status >= 500) return "unavailable"
  if (!response.ok) return "invalid"
  const result = z.object({ status: z.literal(true), user: z.object({ id: z.string() }) }).safeParse(await response.json())
  if (!result.success || result.data.user.id !== user.id) return "invalid"

  const store = await cookies()
  const updated = new NextResponse(null, { headers: response.headers }).cookies
  for (const name of [sessionCookie, sessionDataCookie]) {
    const cookie = updated.get(name)
    if (cookie) store.set(cookie)
  }

  const token = store.get(sessionCookie)?.value
  if (!token) return "unavailable"
  store.set(passwordCookie, issueProof(passwordCookie, token, adminLifetime), {
    ...cookieOptions, sameSite: "strict", maxAge: adminLifetime,
  })
  return "verified"
}

export async function unlockAdminSession(revision: string) {
  const store = await cookies()
  const token = store.get(sessionCookie)?.value
  if (!token) throw new Error("Neon session is missing")
  const proof = issueProof(unlockedCookie + ":" + revision, token, adminLifetime) + "~" + randomBytes(24).toString("base64url")
  const data = { proof_hash: digest(proof), expires_at: new Date(Date.now() + adminLifetime * 1000) }
  const session_hash = digest(token)
  const db = database()
  await db.$transaction([
    db.adminUnlock.deleteMany({ where: { expires_at: { lte: new Date() } } }),
    db.adminUnlock.upsert({ where: { session_hash }, update: data, create: { session_hash, ...data } }),
  ])
  store.set(unlockedCookie, proof, {
    ...cookieOptions, sameSite: "strict", maxAge: adminLifetime,
  })
}

export async function lockAdminSession() {
  const store = await cookies()
  const token = store.get(sessionCookie)?.value
  if (token && backendConfigured) await database().adminUnlock.deleteMany({ where: { session_hash: digest(token) } })
  store.set(unlockedCookie, "", { ...cookieOptions, sameSite: "strict", maxAge: 0 })
}

export async function endAdminSession() {
  const store = await cookies()
  const token = store.get(sessionCookie)?.value
  try {
    if (token && backendConfigured) await database().adminUnlock.deleteMany({ where: { session_hash: digest(token) } })
    if (adminAuthConfigured && store.has(sessionCookie)) await auth().signOut().catch(() => {})
  } finally {
    for (const name of [sessionCookie, sessionDataCookie, passwordCookie, unlockedCookie, ...retiredCookies]) {
      store.set(name, "", { ...cookieOptions, maxAge: 0 })
    }
  }
}

export const adminIdentity = cache(async () => {
  const session = await adminSession()
  if (!session) redirect("/vault8@vein@8/login")
  if (!session.approved) redirect("/vault8@vein@8/login?result=denied")
  if (!session.unlocked) redirect("/vault8@vein@8/verify")
  return { id: session.id, email: session.email }
})

export async function requireAdminDatabase() {
  await adminIdentity()
  return database()
}
