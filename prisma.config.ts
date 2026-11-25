import { existsSync } from "node:fs"
import { defineConfig } from "prisma/config"

for (const path of [".env.local", ".env"]) {
  if (existsSync(path)) process.loadEnvFile(path)
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    url: process.env.DATABASE_URL_UNPOOLED || process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
})
