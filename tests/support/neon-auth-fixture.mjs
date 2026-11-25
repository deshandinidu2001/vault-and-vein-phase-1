import { once } from "node:events"
import { createServer } from "node:http"
import { randomUUID } from "node:crypto"

export const fixtureAdminEmail = "vault-fixture-admin@example.test"
const cookie = "__Secure-neon-auth.session_token"
const challengeCookie = "__Secure-neon-auth.session_challenge"

export async function startAuthFixture() {
  const userFor = (role, id) => ({
    id, name: role, email: "vault-fixture-" + role + "@example.test",
    emailVerified: true, createdAt: new Date(), updatedAt: new Date(),
  })
  const admin = userFor("admin", randomUUID())
  const visitor = userFor("visitor", randomUUID())
  const sessions = new Map()
  const challenges = new Map()
  const codes = new Set()

  function startSession(user, response) {
    const token = randomUUID()
    const now = new Date()
    const session = {
      id: randomUUID(), token, userId: user.id, createdAt: now, updatedAt: now,
      expiresAt: new Date(now.getTime() + 3600000),
    }
    sessions.set(token, { user, session })
    response.setHeader("Set-Cookie", cookie + "=" + token + "; Path=/; Secure; HttpOnly; SameSite=Lax")
    return { user, session }
  }

  const server = createServer(async (request, response) => {
    function send(status, data) {
      response.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" })
      response.end(JSON.stringify(data))
    }

    const url = new URL(request.url, "http://127.0.0.1")
    const cookies = new Map((request.headers.cookie ?? "").split(/;\s*/).map(value => value.split("=")))
    const token = cookies.get(cookie)
    const session = sessions.get(token)

    if (request.method === "GET" && url.pathname === "/auth/mock-google") {
      const challenge = challenges.get(url.searchParams.get("challenge"))
      if (!challenge) return send(403, { code: "INVALID_CHALLENGE" })
      challenge.user = url.searchParams.get("role") === "admin" ? admin : visitor
      challenge.verifier = randomUUID()
      const callback = new URL(challenge.callback)
      callback.searchParams.set("neon_auth_session_verifier", challenge.verifier)
      response.writeHead(302, { Location: callback.href })
      return response.end()
    }
    if (request.method === "GET" && url.pathname === "/auth/get-session") {
      const verifier = url.searchParams.get("neon_auth_session_verifier")
      if (verifier) {
        const key = cookies.get(challengeCookie)
        const challenge = challenges.get(key)
        if (challenge?.verifier !== verifier || !challenge.user) return send(403, { code: "INVALID_CHALLENGE" })
        challenges.delete(key)
        return send(200, startSession(challenge.user, response))
      }
      return send(200, session ?? null)
    }
    if (request.method !== "POST") return send(405, { message: "Method not allowed" })
    if (url.pathname === "/auth/sign-out") {
      sessions.delete(token)
      response.setHeader("Set-Cookie", cookie + "=; Path=/; Max-Age=0; Secure; HttpOnly")
      return send(200, { success: true })
    }

    const body = []
    for await (const chunk of request) body.push(chunk)
    let input
    try {
      input = JSON.parse(Buffer.concat(body).toString("utf8"))
    } catch {
      return send(400, { message: "Invalid request" })
    }

    if (url.pathname === "/auth/sign-in/social") {
      if (input.provider !== "google") return send(400, { code: "INVALID_PROVIDER" })
      const key = randomUUID()
      challenges.set(key, { callback: input.callbackURL })
      response.setHeader("Set-Cookie", challengeCookie + "=" + key + "; Path=/; Secure; HttpOnly; SameSite=None; Partitioned")
      return send(200, { url: "http://127.0.0.1:" + server.address().port + "/auth/mock-google?challenge=" + key, redirect: false })
    }

    if (url.pathname === "/auth/email-otp/send-verification-otp") {
      if (session?.user.id !== admin.id || input.email !== admin.email || input.type !== "email-verification") {
        return send(403, { code: "UNAUTHORIZED" })
      }
      codes.add(input.email)
      return send(200, { success: true })
    }
    if (url.pathname === "/auth/email-otp/verify-email") {
      if (session?.user.id !== admin.id || input.email !== admin.email || input.otp !== "123456" || !codes.delete(input.email)) {
        return send(400, { code: "INVALID_OTP" })
      }
      return send(200, { status: true, token: null, user: admin })
    }

    return send(404, { message: "Not found" })
  })

  server.listen(0, "127.0.0.1")
  await once(server, "listening")
  return {
    url: "http://127.0.0.1:" + server.address().port + "/auth",
    close: () => {
      server.close()
      server.closeAllConnections()
    },
  }
}
