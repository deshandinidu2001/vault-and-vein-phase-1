"use client"

import Link from "next/link"
import { Trash2 } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { GemArt } from "@/components/three/gem-art"
import { StonePrice } from "@/components/shop/stone-price"
import { restoreOverlayFocus, useUi } from "@/store/ui"
import { useCart } from "@/store/cart"

export function CartSheet({ paymentsEnabled }: { paymentsEnabled: boolean }) {
  const { overlay, closeOverlay, openEnquiry } = useUi()
  const { items, remove } = useCart()
  const total = items.reduce((sum, item) => sum + item.price_lkr, 0)
  const hasSamples = items.some(({ is_sample }) => is_sample !== false)
  const canCheckout = paymentsEnabled && !hasSamples && items.length > 0 && items.length <= 12

  return (
    <Sheet open={overlay === "cart"} onOpenChange={(open) => { if (!open && useUi.getState().overlay === "cart") closeOverlay() }}>
      <SheetContent side="right" data-lenis-prevent onCloseAutoFocus={restoreOverlayFocus} className="overlay-scroll w-[min(100vw,28rem)]! max-w-none! overflow-y-auto">
        <SheetHeader className="px-6 pt-12">
          <SheetTitle className="font-display text-4xl">Your cart</SheetTitle>
          <SheetDescription>{paymentsEnabled ? "Review your stones before checkout or send an enquiry." : "Shortlist stones for an enquiry."}</SheetDescription>
        </SheetHeader>
        {items.length === 0 ? <div className="space-y-5 px-6 pb-8">
          <p>Your cart is empty.</p>
          <Link href="/shop" className="pill pill-primary" onClick={closeOverlay}>Explore the shop</Link>
        </div> : <div className="grid gap-6 px-6 pb-8">
          <ul className="grid gap-3">
            {items.map((item) => <li key={item.id} className="grid grid-cols-[64px_minmax(0,1fr)_44px] items-center gap-3 border-b border-emerald/15 pb-3">
              <div className="relative size-16 overflow-hidden rounded-lg bg-muted">
                <GemArt cut={item.cut} tint={item.tint} label="" sizes="64px" />
              </div>
              <div className="min-w-0">
                <Link href={"/shop/" + item.slug} onClick={closeOverlay} className="flex min-h-11 items-center font-semibold hover:underline">{item.name}</Link>
                <p className="text-sm text-muted-foreground">{item.carat} ct · <StonePrice lkr={item.price_lkr} /></p>
              </div>
              <button type="button" className="icon-button size-11!" aria-label={"Remove " + item.name} onClick={() => remove(item.id)}>
                <Trash2 size={17} aria-hidden="true" />
              </button>
            </li>)}
          </ul>
          <div className="flex flex-wrap justify-between gap-2 font-semibold"><span>{hasSamples ? "Sample total" : "Stone subtotal"}</span><StonePrice lkr={total} /></div>
          {canCheckout && <Link href="/checkout" className="pill pill-primary" onClick={closeOverlay}>Go to checkout</Link>}
          <button type="button" className={canCheckout ? "pill" : "pill pill-primary"} onClick={() => openEnquiry(items)}>Request these stones</button>
        </div>}
      </SheetContent>
    </Sheet>
  )
}
