"use client"

import { Check, ShoppingBag } from "lucide-react"
import { EnquireButton } from "@/components/layout/enquire-button"
import { useCart } from "@/store/cart"
import { toast } from "sonner"
import type { Stone } from "@/types/stone"

export function ProductActions({ stone }: { stone: Stone }) {
  const alreadyInCart = useCart((state) => state.items.some(({ id }) => id === stone.id))
  const add = useCart((state) => state.add)

  return <div className="flex flex-wrap gap-3">
    <button type="button" disabled={stone.status !== "available" || alreadyInCart} className="pill pill-primary" onClick={() => {
      add(stone)
      toast.success(stone.name + " added to your cart.")
    }}>
      {alreadyInCart ? <Check size={18} aria-hidden="true" /> : <ShoppingBag size={18} aria-hidden="true" />}
      {alreadyInCart ? "In your cart" : stone.status === "available" ? "Add to Cart" : "Unavailable"}
    </button>
    <EnquireButton stones={[stone]}>Enquire</EnquireButton>
  </div>
}
