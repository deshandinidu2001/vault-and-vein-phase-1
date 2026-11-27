"use client"

import { useEffect } from "react"
import type { UsdRate } from "@/lib/pricing"
import { useUi } from "@/store/ui"

export function CurrencyRateSync({ rate }: { rate: UsdRate | null }) {
  useEffect(() => {
    useUi.setState(rate ? { usdRate: rate } : { usdRate: null, currency: "LKR" })
  }, [rate])
  return null
}
