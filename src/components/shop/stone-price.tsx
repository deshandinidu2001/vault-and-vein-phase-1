"use client"

import { useUi } from "@/store/ui"
import { formatPrice } from "@/lib/pricing"

export function StonePrice({ lkr, both = false }: { lkr: number; both?: boolean }) {
  const currency = useUi((state) => state.currency)
  const rate = useUi((state) => state.usdRate)
  const secondary = currency === "LKR" ? "USD" : "LKR"
  return <span className="tabular-nums" aria-live="polite">
    {formatPrice(lkr, currency, rate?.lkrPerUsd)}
    {both && rate && <span className="ml-3 text-sm font-normal text-muted-foreground">≈ {formatPrice(lkr, secondary, rate.lkrPerUsd)}</span>}
  </span>
}

export function UsdRateNote() {
  const rate = useUi((state) => state.usdRate)
  return <p className="text-sm text-muted-foreground">
    {rate ? <>USD estimate using the {rate.date} exchange rate. Checkout is in LKR.</> : "Checkout is in LKR."}
  </p>
}
