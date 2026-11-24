import "server-only"
import { createNeonAuth } from "@neon/auth/next/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { cache } from "react"
import { backendConfigured, database } from "./backend"

const baseUrl = process.env.NEON_AUTH_BASE_URL
const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET
const approvedAdmins = new Set(
  (process.env.NEON_ADMIN_USER_IDS ?? "").split(",").map((id) => id.trim()).filter(Boolean),
)

const authUrl = baseUrl && URL.canParse(baseUrl) ? new URL(baseUrl) : null
const validAuthUrl = authUrl && (authUrl.protocol === "https:" ||
  (process.env.NODE_ENV === "development" && authUrl.protocol === "http:" && authUrl.hostname === "127.0.0.1"))
export const adminAuthConfigured = Boolean(backendConfigured && validAuthUrl &&
  cookieSecret && cookieSecret.length >= 32 && approvedAdmins.size)

let neonAuth: ReturnType<typeof createNeonAuth> | undefined
const sessionCookie = "__Secure-neon-auth.session_token"
const sessionDataCookie = "__Secure-neon-auth.local.session_data"

function auth() {
  if (!adminAuthConfigured || !authUrl || !cookieSecret) throw new Error("Neon admin sign-in is not configured")
  return neonAuth ??= createNeonAuth({
    baseUrl: authUrl.href,
    cookies: { secret: cookieSecret, sameSite: "strict" },
  })
}

export async function startAdminSession(email: string, password: string) {
  const { data, error } = await auth().signIn.email({ email: email.trim().toLowerCase(), password, rememberMe: false })
  if (error && error.status >= 500) throw new Error("Neon Auth is unavailable")
  if (!data?.user) return false
  if (!approvedAdmins.has(data.user.id)) {
    // The SDK writes these cookies before returning the user. Do not send them to an unapproved account.
    const store = await cookies()
    for (const name of [sessionCookie, sessionDataCookie]) {
      store.set(name, "", { path: "/", maxAge: 0, secure: true, httpOnly: true, sameSite: "strict" })
    }
    return false
  }
  return true
}

export async function endAdminSession() {
  const { error } = await auth().signOut()
  if (error) throw new Error("Neon Auth could not end the session")
}

export const adminIdentity = cache(async () => {
  if (!adminAuthConfigured || !(await cookies()).has(sessionCookie)) {
    redirect("/admin/login")
  }

  // Check the provider on every request so a revoked or expired session cannot use cached admin access.
  const { data, error } = await auth().getSession({ query: { disableCookieCache: "true", disableRefresh: "true" } })
  if (error || !data?.session || !data.user || !approvedAdmins.has(data.user.id)) redirect("/admin/login")
  return { id: data.user.id, email: data.user.email }
})

export async function requireAdminDatabase() {
  await adminIdentity()
  return database()
}

export async function updateAdminPassword(current: string, password: string) {
  const { error } = await auth().changePassword({
    currentPassword: current,
    newPassword: password,
    revokeOtherSessions: true,
  })
  if (error?.code === "invalid_credentials") return false
  if (error) throw new Error("Neon Auth could not change the password")
  return true
}
