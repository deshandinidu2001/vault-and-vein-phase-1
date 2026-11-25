import "server-only"
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"
import { createNeonAuth } from "@neon/auth/next/server"
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { NextResponse, type NextRequest } from "next/server"
import { cache } from "react"
import { z } from "zod"
import { backendConfigured, database } from "./backend"

const baseUrl = process.env.NEON_AUTH_BASE_URL
const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET
const approvedEmails = new Set(
  (process.env.NEON_ADMIN_GOOGLE_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean),
)
const authUrl = baseUrl && URL.canParse(baseUrl) ? new URL(baseUrl) : null
const validAuthUrl = authUrl && (authUrl.protocol === "https:" ||
  (process.env.NODE_ENV === "development" && authUrl.protocol === "http:" && authUrl.hostname === "127.0.0.1"))
export const adminAuthConfigured = Boolean(backendConfigured && validAuthUrl &&
  cookieSecret && cookieSecret.length >= 32 && approvedEmails.size)

const sessionCookie = "__Secure-neon-auth.session_token"
const sessionDataCookie = "__Secure-neon-auth.local.session_data"
const attemptCookie = "__Host-vault-admin-oauth"
const googleCookie = "__Host-vault-admin-google"
const verifiedCookie = "__Host-vault-admin-verified"
const oauthCallback = "/admin/oauth/callback"
const stepLifetime = 10 * 60
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

export async function startAdminGoogleSignIn(origin: string) {
  const store = await cookies()
  const attempt = randomBytes(24).toString("base64url")
  const callback = new URL(oauthCallback, origin)
  callback.searchParams.set("attempt", attempt)
  const { data, error } = await auth().signIn.social({
    provider: "google",
    callbackURL: callback.href,
    errorCallbackURL: new URL("/admin/login?result=google-failed", origin).href,
    disableRedirect: true,
  })
  if (error || !data?.url || !URL.canParse(data.url)) return null
  const target = new URL(data.url)
  if (!(target.origin === authUrl?.origin || target.origin === "https://accounts.google.com")) return null
  store.set(attemptCookie, attempt, { ...cookieOptions, maxAge: stepLifetime })
  store.set(googleCookie, "", { ...cookieOptions, maxAge: 0 })
  store.set(verifiedCookie, "", { ...cookieOptions, maxAge: 0 })
  return target.href
}

export async function finishAdminGoogleSignIn(request: NextRequest) {
  const failure = () => new NextResponse(null, { status: 303, headers: { Location: "/admin/login?result=google-failed" } })
  const attempt = request.cookies.get(attemptCookie)?.value
  const { searchParams } = request.nextUrl
  if (!adminAuthConfigured || !attempt || searchParams.get("attempt") !== attempt ||
    !searchParams.get("neon_auth_session_verifier")) return failure()

  // Neon exchanges the verifier and its challenge cookie for a session on this origin.
  const response = await auth().middleware({ loginUrl: "/admin/login" })(request)
  const token = response.cookies.get(sessionCookie)?.value
  if (!token || !response.headers.has("location")) return failure()

  response.headers.set("Location", "/admin/verify")
  response.headers.set("Cache-Control", "private, no-store")
  response.cookies.set(attemptCookie, "", { ...cookieOptions, maxAge: 0 })
  response.cookies.set(googleCookie, issueProof(googleCookie, token, stepLifetime), { ...cookieOptions, maxAge: stepLifetime })
  return response
}

const adminSession = cache(async () => {
  if (!adminAuthConfigured) return null
  const store = await cookies()
  const token = store.get(sessionCookie)?.value
  if (!token) return null
  const verified = validProof(verifiedCookie, store.get(verifiedCookie)?.value, token)
  if (!verified && !validProof(googleCookie, store.get(googleCookie)?.value, token)) return null

  // Check Neon on each request so an expired or revoked session cannot grant admin access.
  const { data, error } = await auth().getSession({ query: { disableCookieCache: "true", disableRefresh: "true" } })
  if (error || !data?.session || !data.user) return null
  const { id, email, emailVerified } = data.user
  return { id, email, approved: emailVerified === true && approvedEmails.has(email.toLowerCase()), verified }
})

export async function pendingAdminIdentity() {
  const session = await adminSession()
  if (!session) redirect("/admin/login")
  if (!session.approved) redirect("/admin/login?result=denied")
  if (session.verified) redirect("/admin")
  return session
}

async function emailOtp(operation: "send-verification-otp" | "verify-email", body: object) {
  // The SDK proxy supports the Email OTP endpoints, including on versions without typed server helpers.
  const incoming = await headers()
  const origin = incoming.get("origin")
  if (!origin || !URL.canParse(origin)) throw new Error("Missing verification request origin")
  const request = new Request(new URL("/admin/verify", origin), {
    method: "POST",
    headers: { Origin: origin, Cookie: incoming.get("cookie") ?? "", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return auth().handler().POST(request, { params: Promise.resolve({ path: ["email-otp", operation] }) })
}

export async function sendAdminVerification(email: string) {
  const response = await emailOtp("send-verification-otp", { email, type: "email-verification" })
  if (response.status === 429) return "limited"
  const data = z.object({ success: z.literal(true) }).safeParse(await response.json())
  return response.ok && data.success ? "sent" : "unavailable"
}

export async function verifyAdminCode(user: { id: string; email: string }, code: string) {
  const response = await emailOtp("verify-email", { email: user.email, otp: code })
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
  store.set(verifiedCookie, issueProof(verifiedCookie, token, adminLifetime), {
    ...cookieOptions, sameSite: "strict", maxAge: adminLifetime,
  })
  store.set(googleCookie, "", { ...cookieOptions, maxAge: 0 })
  return "verified"
}

export async function endAdminSession() {
  const store = await cookies()
  try {
    if (adminAuthConfigured && store.has(sessionCookie)) await auth().signOut().catch(() => {})
  } finally {
    for (const name of [sessionCookie, sessionDataCookie, attemptCookie, googleCookie, verifiedCookie]) {
      store.set(name, "", { ...cookieOptions, maxAge: 0 })
    }
  }
}

export const adminIdentity = cache(async () => {
  const session = await adminSession()
  if (!session) redirect("/admin/login")
  if (!session.approved) redirect("/admin/login?result=denied")
  if (!session.verified) redirect("/admin/verify")
  return { id: session.id, email: session.email }
})

export async function requireAdminDatabase() {
  await adminIdentity()
  return database()
}
