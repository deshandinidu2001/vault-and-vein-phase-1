import "server-only"
import { unstable_cache } from "next/cache"
import { cache } from "react"
import { catalogueConfigured, CatalogueUnavailableError, database, publicSettingsTag } from "./backend"
import type { ShopFilterRow } from "./shop-filter-config"

export async function readShopFilterSettings(db = database()) {
  const rows = await db.shopFilterSetting.findMany({ orderBy: [{ filter_key: "asc" }, { value: "asc" }] })
  return { rows: rows as ShopFilterRow[], ready: true }
}

const publicSettings = unstable_cache(() => readShopFilterSettings(), ["public-shop-filters"], {
  revalidate: 60, tags: [publicSettingsTag],
})

export const getShopFilterSettings = cache(async () => {
  if (!catalogueConfigured) return { rows: [], ready: false }
  try {
    return await publicSettings()
  } catch {
    throw new CatalogueUnavailableError("Could not load shop filter settings")
  }
})
