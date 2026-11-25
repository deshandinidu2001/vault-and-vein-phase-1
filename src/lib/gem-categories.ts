import "server-only"
import { cache } from "react"
import { unstable_cache } from "next/cache"
import { gemNames } from "@/types/stone"
import { catalogueConfigured, CatalogueUnavailableError, database, publicSettingsTag } from "./backend"

const defaults = Object.entries(gemNames).map(([slug, name]) => ({ slug, name: name ?? slug, is_visible: true }))

export function readGemCategories(db = database()) {
  return db.gemCategory.findMany({
    select: { slug: true, name: true, is_visible: true },
    orderBy: { name: "asc" },
  })
}

const publicCategories = unstable_cache(async () => {
  return (await readGemCategories()).filter(({ is_visible }) => is_visible)
}, ["public-gem-categories"], { revalidate: 60, tags: [publicSettingsTag] })

export const getGemCategories = cache(async () => {
  if (!catalogueConfigured) return { categories: defaults }
  try {
    return { categories: await publicCategories() }
  } catch {
    throw new CatalogueUnavailableError("Could not load gem categories")
  }
})
