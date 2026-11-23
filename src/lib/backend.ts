import "server-only"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@/generated/prisma/client"

const url = process.env.DATABASE_URL
export const backendConfigured = Boolean(url)
export const catalogueConfigured = backendConfigured
export const publicSettingsTag = "public-shop-settings"

export class CatalogueUnavailableError extends Error {}

const globalDatabase = globalThis as typeof globalThis & { vaultDatabase?: PrismaClient }

export function database() {
  if (!url) throw new Error("DATABASE_URL is required")
  return globalDatabase.vaultDatabase ??= new PrismaClient({
    adapter: new PrismaPg({ connectionString: url, max: 5, connectionTimeoutMillis: 8000 }),
  })
}
