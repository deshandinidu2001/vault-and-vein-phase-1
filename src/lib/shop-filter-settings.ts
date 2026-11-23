import "server-only"
import { connection } from "next/server"
import { cache } from "react"
import { catalogueConfigured, publicSettingsDatabase, type publicDatabase } from "./backend"
import { isMissingInventorySchema } from "./gem-categories"
import type { ShopFilterRow } from "./shop-filter-config"

export async function readShopFilterSettings(db: ReturnType<typeof publicDatabase>) {
  const rows: ShopFilterRow[] = []
  for (let start = 0; ; start += 500) {
    const { data, error } = await db.from("shop_filter_settings").select("filter_key,value,label,is_visible")
      .order("filter_key").order("value").range(start, start + 499)
      .overrideTypes<ShopFilterRow[], { merge: false }>()
    if (isMissingInventorySchema(error)) return { rows: [], ready: false }
    if (error) throw new Error("Could not load shop filter settings")
    rows.push(...data)
    if (data.length < 500) return { rows, ready: true }
  }
}

export const getShopFilterSettings = cache(async () => {
  if (!catalogueConfigured) return { rows: [], ready: false }
  await connection()
  return readShopFilterSettings(publicSettingsDatabase())
})
