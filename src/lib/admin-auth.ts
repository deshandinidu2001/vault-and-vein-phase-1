import "server-only"
import { createHash, randomBytes } from "node:crypto"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { cache } from "react"
import { backendConfigured, database } from "./backend"
import { hashPassword, verifyPassword } from "./admin-password.mjs"

const cookieName = "vault_admin_session"
const sessionAge = 8 * 60 * 60 * 1000
const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex")

async function currentToken() {
  const token = (await cookies()).get(cookieName)?.value
  return token && /^[a-f0-9]{64}$/.test(token) ? tokenHash(token) : null
}

export async function startAdminSession(email: string, password: string) {
  const db = database()
  const admin = await db.adminUser.findUnique({ where: { email: email.trim().toLowerCase() } })
  if (!await verifyPassword(password, admin?.password_hash) || !admin) return false

  const token = randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + sessionAge)
  const created = await db.$transaction(async (tx) => {
    // Serialize issuance with password changes so a verified old password cannot create a new session.
    const match = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM public.admin_users
      WHERE id = ${admin.id}::uuid AND password_hash = ${admin.password_hash}
      FOR UPDATE
    `
    if (!match.length) return false
    await tx.adminSession.deleteMany({ where: { admin_id: admin.id, expires_at: { lte: new Date() } } })
    await tx.adminSession.create({ data: { token_hash: tokenHash(token), admin_id: admin.id, expires_at: expires } })
    return true
  })
  if (!created) return false

  const cookieStore = await cookies()
  cookieStore.set(cookieName, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/admin", expires,
  })
  return true
}

export async function endAdminSession() {
  const token = await currentToken()
  if (token) await database().adminSession.deleteMany({ where: { token_hash: token } })
  await clearAdminCookie()
}

async function clearAdminCookie() {
  const cookieStore = await cookies()
  cookieStore.set(cookieName, "", { path: "/admin", expires: new Date(0) })
}

export const adminIdentity = cache(async () => {
  if (!backendConfigured) redirect("/admin/login")
  const token = await currentToken()
  if (!token) redirect("/admin/login")
  const session = await database().adminSession.findUnique({
    where: { token_hash: token, expires_at: { gt: new Date() } },
    select: { admin: { select: { id: true, email: true } } },
  })
  if (!session) redirect("/admin/login")
  return session.admin
})

export async function requireAdminDatabase() {
  await adminIdentity()
  return database()
}

export async function updateAdminPassword(id: string, current: string, password: string) {
  const db = database()
  const admin = await db.adminUser.findUnique({ where: { id } })
  if (!await verifyPassword(current, admin?.password_hash) || !admin) return false
  const replacement = await hashPassword(password)
  const updated = await db.$transaction(async (tx) => {
    const { count } = await tx.adminUser.updateMany({
      where: { id, password_hash: admin.password_hash }, data: { password_hash: replacement },
    })
    if (!count) return false
    await tx.adminSession.deleteMany({ where: { admin_id: id } })
    return true
  })
  if (updated) await clearAdminCookie()
  return updated
}
