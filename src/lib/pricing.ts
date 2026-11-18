import { site } from "@/config/site"
import type { Currency } from "@/store/ui"

export function formatPrice(lkr: number, currency: Currency) {
  return new Intl.NumberFormat(currency === "LKR" ? "en-LK" : "en-US", {
    style: "currency", currency, currencyDisplay: "code", minimumFractionDigits: 0,
    maximumFractionDigits: currency === "LKR" ? 0 : 2,
  }).format(currency === "LKR" ? lkr : lkr / site.lkrPerUsd)
}
