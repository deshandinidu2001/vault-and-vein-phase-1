import "server-only"
import { cache } from "react"
import { connection } from "next/server"
import { gemNames, type GemCategory } from "@/types/stone"
import { catalogueConfigured, publicDatabase } from "./backend"

const defaults = Object.entries(gemNames).map(([slug, name]) => ({ slug, name: name ?? slug, is_visible: true }))

export function isMissingInventorySchema(error: { code: string } | null) {
  return error?.code === "42P01" || error?.code === "42703" || error?.code === "PGRST205" || error?.code === "PGRST204"
}

type CatalogueDatabase = ReturnType<typeof publicDatabase>

export async function readGemCategories(db: CatalogueDatabase) {
  const { data, error } = await db.from("gem_categories").select("slug,name,is_visible").order("name")
  if (!error) return { categories: data as GemCategory[], inventoryReady: true, visibilityReady: true }
  if (!isMissingInventorySchema(error)) throw new Error("Could not load gem categories")
  const legacy = await db.from("gem_categories").select("slug,name").order("name")
  if (isMissingInventorySchema(legacy.error)) return { categories: defaults, inventoryReady: false, visibilityReady: false }
  if (legacy.error) throw new Error("Could not load gem categories")
  return { categories: legacy.data.map((category) => ({ ...category, is_visible: true })), inventoryReady: true, visibilityReady: false }
}

export const getGemCategories = cache(async () => {
  if (!catalogueConfigured) return { categories: defaults, inventoryReady: false, visibilityReady: false }
  await connection()
  return readGemCategories(publicDatabase())
})
