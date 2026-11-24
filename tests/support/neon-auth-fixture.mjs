import { once } from "node:events"
import { createServer } from "node:http"
import { randomUUID } from "node:crypto"

export const fixtureAdminId = "7667eca3-f954-469f-8d08-28d49eec9146"
const cookie = "__Secure-neon-auth.session_token"

export async function startAuthFixture() {
  const userFor = (role, id) => ({
    id, name: role, email: "vault-fixture-" + role + "@example.test",
    emailVerified: true, createdAt: new Date(), updatedAt: new Date(),
  })
  const admin = userFor("admin", fixtureAdminId)
  const visitor = userFor("visitor", randomUUID())
  const sessions = new Map()
  let adminPassword = "fixture-password"

  function startSession(user, response) {
    const token = randomUUID()
    const now = new Date()
    const session = {
      id: randomUUID(), token, userId: user.id, createdAt: now, updatedAt: now,
      expiresAt: new Date(now.getTime() + 3600000),
    }
    sessions.set(token, { user, session })
    response.setHeader("Set-Cookie", cookie + "=" + token + "; Path=/; Secure; HttpOnly; SameSite=Strict")
    return { token, user }
  }

  const server = createServer(async (request, response) => {
    function send(status, data) {
      response.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" })
      response.end(JSON.stringify(data))
    }

    const url = new URL(request.url, "http://127.0.0.1")
    const token = request.headers.cookie?.split(/;\s*/).find(value => value.startsWith(cookie + "="))?.slice(cookie.length + 1)
    const session = sessions.get(token)

    if (request.method === "GET" && url.pathname === "/auth/get-session") {
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

    if (url.pathname === "/auth/sign-in/email") {
      const approved = input.email === admin.email && input.password === adminPassword
      const unapproved = input.email === visitor.email && input.password === "fixture-password"
      if (!approved && !unapproved) return send(401, { code: "INVALID_EMAIL_OR_PASSWORD" })
      return send(200, startSession(approved ? admin : visitor, response))
    }

    if (url.pathname === "/auth/change-password") {
      if (session?.user.id !== admin.id) return send(401, { code: "UNAUTHORIZED" })
      if (input.currentPassword !== adminPassword) return send(400, { code: "INVALID_PASSWORD" })
      if (!input.revokeOtherSessions) return send(400, { message: "Expected session revocation" })
      adminPassword = input.newPassword
      for (const [token, value] of sessions) {
        if (value.user.id === admin.id) sessions.delete(token)
      }
      return send(200, startSession(admin, response))
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
