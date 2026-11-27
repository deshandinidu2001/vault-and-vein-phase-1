import type { Currency } from "@/store/ui"

export type UsdRate = { date: string; lkrPerUsd: number }

export function formatPrice(lkr: number, preference: Currency, lkrPerUsd: number | null = null) {
  const currency = lkrPerUsd ? preference : "LKR"
  return new Intl.NumberFormat(currency === "LKR" ? "en-LK" : "en-US", {
    style: "currency", currency, currencyDisplay: "code", minimumFractionDigits: 0,
    maximumFractionDigits: currency === "LKR" ? 0 : 2,
  }).format(preference === "USD" && lkrPerUsd ? lkr / lkrPerUsd : lkr)
}
