import { existsSync } from "node:fs"
import { Client } from "pg"
import { z } from "zod"
import { hashPassword } from "../src/lib/admin-password.mjs"

for (const path of [".env.local", ".env"]) {
  if (existsSync(path)) process.loadEnvFile(path)
}

const email = z.email().max(254).safeParse(process.argv[2]?.trim().toLowerCase())
const password = process.env.VAULT_ADMIN_PASSWORD
const url = process.env.DIRECT_URL || process.env.DATABASE_URL
if (!email.success || !password || password.length < 12 || password.length > 128 || !url) {
  console.error("Supply an admin email, VAULT_ADMIN_PASSWORD (12 to 128 characters), and a database connection URL.")
  process.exit(1)
}

const client = new Client({ connectionString: url })
try {
  await client.connect()
  const result = await client.query(
    "INSERT INTO public.admin_users (email, password_hash) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING",
    [email.data, await hashPassword(password)],
  )
  if (!result.rowCount) {
    console.error("An admin with this email already exists.")
    process.exitCode = 1
  } else {
    console.log("Admin created. Sign in at /admin/login.")
  }
} catch (error) {
  console.error("Could not create the admin. Check the database connection and apply the Prisma migrations.", error.code ?? "")
  process.exitCode = 1
} finally {
  await client.end()
}
