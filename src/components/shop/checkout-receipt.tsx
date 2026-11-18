"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/store/cart"

export function CheckoutReceipt({ confirmedIds, refresh }: { confirmedIds: string[]; refresh: boolean }) {
  const router = useRouter()
  useEffect(() => {
    if (!confirmedIds.length) return
    // CartHydration owns the first read. Also handle a receipt opened in a fresh tab.
    const clearPurchased = () => {
      const { items, remove } = useCart.getState()
      items.filter(({ id }) => confirmedIds.includes(id)).forEach(({ id }) => remove(id))
    }
    if (!useCart.persist || useCart.persist.hasHydrated()) clearPurchased()
    else return useCart.persist.onFinishHydration(clearPurchased)
  }, [confirmedIds])

  return refresh && <button className="pill pill-primary mr-4" type="button" onClick={() => router.refresh()}>Refresh status</button>
}
