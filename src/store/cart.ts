import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type { Stone } from "@/types/stone"

export type CartStone = Pick<Stone, "id" | "slug" | "name" | "gem_type" | "carat" | "cut" | "tint" | "price_lkr" | "is_sample" | "image_url">

type CartState = {
  items: CartStone[]
  add: (stone: Stone) => void
  remove: (id: string) => void
}

export const useCart = create<CartState>()(persist((set) => ({
  items: [],
  add: (stone) => {
    if (stone.status !== "available") return
    const { id, slug, name, gem_type, carat, cut, tint, price_lkr, is_sample, image_url } = stone
    const cartStone = { id, slug, name, gem_type, carat, cut, tint, price_lkr, is_sample, image_url }
    set(({ items }) => items.some((item) => item.id === id)
      ? { items: items.map((item) => item.id === id ? cartStone : item) }
      : { items: [...items, cartStone] })
  },
  remove: (id) => set(({ items }) => ({ items: items.filter((item) => item.id !== id) })),
}), {
  name: "vault-and-vein-cart", storage: typeof window === "undefined" ? undefined : createJSONStorage(() => window.localStorage), skipHydration: true,
}))
