import "server-only"

import { cache } from "react"
import { z } from "zod"
import type { UsdRate } from "./pricing"

const usdFeeds = [
  "https://latest.currency-api.pages.dev/v1/currencies/usd.min.json",
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json",
]
const rateResponse = z.object({
  date: z.iso.date(),
  usd: z.object({ lkr: z.number().finite().positive() }),
})

export const getUsdRate = cache(async (): Promise<UsdRate | null> => {
  for (const feed of usdFeeds) {
    try {
      const response = await fetch(feed, {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(2000),
      })
      if (!response.ok) continue
      const parsed = rateResponse.safeParse(await response.json())
      if (!parsed.success) continue
      const { date, usd } = parsed.data
      const age = Date.now() - Date.parse(date)
      if (age < -86_400_000 || age > 7 * 86_400_000) continue
      return { date, lkrPerUsd: usd.lkr }
    } catch {
      // Try the alternate host if the feed is unavailable.
    }
  }
  return null
})
