"use client"

import { Check, CreditCard, ShoppingBag } from "lucide-react"
import { EnquireButton } from "@/components/layout/enquire-button"
import { useCart } from "@/store/cart"
import { toast } from "sonner"
import type { Stone } from "@/types/stone"

export function ProductActions({ stone, paymentsEnabled }: { stone: Stone; paymentsEnabled: boolean }) {
  const alreadyInCart = useCart((state) => state.items.some(({ id }) => id === stone.id))
  const add = useCart((state) => state.add)
  if (stone.is_sample) return <div><EnquireButton stones={[stone]}>Ask about this stone</EnquireButton></div>
  const canBuy = paymentsEnabled && stone.status === "available" && stone.is_sample === false

  return <div className="grid gap-5">
    <div className="flex flex-wrap gap-3">
      <button type="button" disabled={stone.status !== "available" || alreadyInCart} className={canBuy ? "pill" : "pill pill-primary"} onClick={() => {
        add(stone)
        toast.success(stone.name + " added to your cart.")
      }}>
        {alreadyInCart ? <Check size={18} aria-hidden="true" /> : <ShoppingBag size={18} aria-hidden="true" />}
        {alreadyInCart ? "In your cart" : stone.status === "available" ? "Add to Cart" : "Unavailable"}
      </button>
      <EnquireButton stones={[stone]}>Ask about this stone</EnquireButton>
    </div>
    {stone.status === "available" && stone.is_sample === false && (
      <section className="grid gap-3 rounded-xl border border-emerald/15 bg-[#e8ebe0] p-4 sm:p-5" aria-labelledby="product-checkout-title">
        <h2 id="product-checkout-title" className="flex items-center gap-2 font-sans text-base font-semibold"><CreditCard size={18} aria-hidden="true" /> Online checkout</h2>
        <p className="text-sm text-muted-foreground">{canBuy ? "Review delivery and pay in LKR through PayHere." : "Online payment is currently unavailable. Ask us about this stone."}</p>
        <button type="button" className="pill pill-primary w-fit" disabled={!canBuy} onClick={() => {
          add(stone)
          // Checkout needs a fresh document for its per-request script policy.
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.assign("/checkout?" + new URLSearchParams({ item: stone.id }))
        }}>Buy now</button>
      </section>
    )}
  </div>
}
