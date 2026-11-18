"use client"

import { useUi } from "@/store/ui"
import { formatPrice } from "@/lib/pricing"

export function StonePrice({ lkr, both = false }: { lkr: number; both?: boolean }) {
  const currency = useUi((state) => state.currency)
  const secondary = currency === "LKR" ? "USD" : "LKR"
  return <span className="tabular-nums" aria-live="polite">
    {formatPrice(lkr, currency)}
    {both && <span className="ml-3 text-sm font-normal text-muted-foreground">≈ {formatPrice(lkr, secondary)}</span>}
  </span>
}
