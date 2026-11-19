"use client"

import Link from "next/link"
import { ArrowUpRight, CreditCard, Trash2 } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { StoneMedia } from "@/components/product/stone-media"
import { StonePrice } from "@/components/shop/stone-price"
import { restoreOverlayFocus, useUi } from "@/store/ui"
import { useCart } from "@/store/cart"

export function CartSheet({ paymentsEnabled }: { paymentsEnabled: boolean }) {
  const { overlay, closeOverlay, openEnquiry } = useUi()
  const { items, remove } = useCart()
  const total = items.reduce((sum, item) => sum + item.price_lkr, 0)
  const payable = items.filter(({ is_sample }) => is_sample === false)
  const hasSamples = payable.length !== items.length
  const canCheckout = paymentsEnabled && payable.length > 0 && payable.length <= 12

  return (
    <Sheet open={overlay === "cart"} onOpenChange={(open) => { if (!open && useUi.getState().overlay === "cart") closeOverlay() }}>
      <SheetContent side="right" data-lenis-prevent onCloseAutoFocus={restoreOverlayFocus} className="overlay-scroll w-[min(100vw,28rem)]! max-w-none! overflow-y-auto">
        <SheetHeader className="px-6 pt-12">
          <SheetTitle className="font-display text-4xl">Your cart</SheetTitle>
          <SheetDescription>Review your selected stones.</SheetDescription>
        </SheetHeader>
        {items.length === 0 ? <div className="space-y-5 px-6 pb-8">
          <p>Your cart is empty.</p>
          <Link href="/shop" className="pill pill-primary" onClick={closeOverlay}>Explore the shop</Link>
        </div> : <div className="grid gap-6 px-6 pb-8">
          <ul className="grid gap-3">
            {items.map((item) => <li key={item.id} className="grid grid-cols-[64px_minmax(0,1fr)_44px] items-center gap-3 border-b border-emerald/15 pb-3">
              <div className="relative size-16 overflow-hidden rounded-lg bg-muted">
                <StoneMedia stone={item} label="" sizes="64px" width={160} />
              </div>
              <div className="min-w-0">
                <Link href={"/shop/" + item.slug} onClick={closeOverlay} className="flex min-h-11 items-center font-semibold hover:underline">{item.name}</Link>
                <p className="text-sm text-muted-foreground">{item.carat} ct · <StonePrice lkr={item.price_lkr} /></p>
                {item.is_sample === false && items.length > 1 && paymentsEnabled && (
                  <Link href={{ pathname: "/checkout", query: { item: item.id } }} onClick={closeOverlay}
                    className="line-link text-sm" aria-label={"Pay for this stone: " + item.name}>Pay for this stone <ArrowUpRight size={15} aria-hidden="true" /></Link>
                )}
              </div>
              <button type="button" className="icon-button size-11!" aria-label={"Remove " + item.name} onClick={() => remove(item.id)}>
                <Trash2 size={17} aria-hidden="true" />
              </button>
            </li>)}
          </ul>
          <div className="flex flex-wrap justify-between gap-2 font-semibold"><span>{!payable.length ? "Sample total" : "Stone subtotal"}</span><StonePrice lkr={total} /></div>
          {hasSamples && payable.length > 0 && <p className="text-sm text-muted-foreground">You can ask us about the sample stones in your cart.</p>}
          <section className="grid gap-3 rounded-xl border border-emerald/15 bg-[#e8ebe0] p-4" aria-labelledby="cart-checkout-title">
            <h2 id="cart-checkout-title" className="flex items-center gap-2 font-sans text-base font-semibold"><CreditCard size={18} aria-hidden="true" /> Online checkout</h2>
            <p className="text-sm text-muted-foreground">
              {!payable.length ? "You can ask us about the sample stones in your cart."
                : !paymentsEnabled ? "Online payment is currently unavailable."
                  : payable.length > 12 ? "Pay for a single stone or reduce the cart to 12 payable stones."
                    : "Review delivery and pay in LKR through PayHere."}
            </p>
            {canCheckout
              ? <Link href="/checkout" className="pill pill-primary" onClick={closeOverlay}>Go to checkout</Link>
              : <button type="button" className="pill pill-primary" disabled>Go to checkout</button>}
          </section>
          <button type="button" className="pill" onClick={() => openEnquiry(items)}>{items.length === 1 ? "Ask about this stone" : "Ask about these stones"}</button>
        </div>}
      </SheetContent>
    </Sheet>
  )
}
