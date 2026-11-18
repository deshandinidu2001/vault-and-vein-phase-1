"use client"

import Link from "next/link"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { restoreOverlayFocus, useUi } from "@/store/ui"

export function CartSheet() {
  const { overlay, closeOverlay } = useUi()
  return <Sheet open={overlay === "cart"} onOpenChange={(open) => { if (!open && useUi.getState().overlay === "cart") closeOverlay() }}>
    <SheetContent side="right" onCloseAutoFocus={restoreOverlayFocus} className="overlay-scroll">
      <SheetHeader className="px-6 pt-12"><SheetTitle className="font-display text-4xl">Your cart</SheetTitle><SheetDescription>Shortlist stones for an enquiry.</SheetDescription></SheetHeader>
      <div className="space-y-5 p-6"><p>Your cart is empty.</p><Link href="/shop" className="pill pill-primary" onClick={closeOverlay}>Explore the shop</Link></div>
    </SheetContent>
  </Sheet>
}
