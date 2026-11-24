import { existsSync } from "node:fs"
import { z } from "zod"

for (const path of [".env.local", ".env"]) {
  if (existsSync(path)) process.loadEnvFile(path)
}

const email = z.email().max(254).safeParse(process.argv[2]?.trim().toLowerCase())
const password = process.env.VAULT_ADMIN_PASSWORD
const baseUrl = process.env.NEON_AUTH_BASE_URL
const authUrl = baseUrl && URL.canParse(baseUrl) ? new URL(baseUrl) : null
if (!email.success || !password || password.length < 12 || password.length > 128 || authUrl?.protocol !== "https:") {
  console.error("Supply your email, VAULT_ADMIN_PASSWORD (12 to 128 characters), and an HTTPS NEON_AUTH_BASE_URL.")
  process.exit(1)
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
try {
  const endpoint = authUrl.href.replace(/\/$/, "") + "/sign-up/email"
  const response = await fetch(endpoint, {
    method: "POST",
    redirect: "error",
    signal: AbortSignal.timeout(15000),
    headers: { "Content-Type": "application/json", Origin: new URL(siteUrl).origin },
    body: JSON.stringify({ email: email.data, name: email.data.split("@")[0], password }),
  })
  const result = z.object({ user: z.object({ id: z.string().min(1), email: z.string() }) }).safeParse(await response.json())
  if (!response.ok || !result.success || result.data.user.email.toLowerCase() !== email.data) {
    console.error("Neon could not create the account. Check the Auth URL, trusted origin, and whether this email already has an account.")
    process.exitCode = 1
  } else {
    console.log("Neon Auth user created. Confirm this user ID in Neon → Auth → Users and add it to NEON_ADMIN_USER_IDS.")
    console.log(result.data.user.id)
  }
} catch {
  console.error("Could not reach Neon Auth. Check NEON_AUTH_BASE_URL and your connection.")
  process.exitCode = 1
}
