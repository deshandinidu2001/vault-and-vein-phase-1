import "server-only"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@/generated/prisma/client"

const url = process.env.DATABASE_URL
export const backendConfigured = Boolean(url)
export const catalogueConfigured = backendConfigured
export const publicSettingsTag = "public-shop-settings"

export class CatalogueUnavailableError extends Error {}

const globalDatabase = globalThis as typeof globalThis & {
  vaultDatabase?: { client: PrismaClient; generatedClient: typeof PrismaClient }
}

export function database() {
  if (!url) throw new Error("DATABASE_URL is required")
  const cached = globalDatabase.vaultDatabase
  // Next.js hot reload preserves globalThis when the generated Prisma module changes.
  if (cached?.client && (process.env.NODE_ENV !== "development" || cached.generatedClient === PrismaClient)) {
    return cached.client
  }

  const client = new PrismaClient({
    adapter: new PrismaPg({ connectionString: url, max: 5, connectionTimeoutMillis: 8000 }),
  })
  globalDatabase.vaultDatabase = { client, generatedClient: PrismaClient }
  return client
}
