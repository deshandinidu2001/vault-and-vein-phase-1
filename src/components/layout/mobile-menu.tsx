"use client"

import { ArrowUpRight } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { navigation } from "@/config/site"
import { restoreOverlayFocus, useUi } from "@/store/ui"
import { EnquireButton } from "./enquire-button"
import { NavigationLink } from "./navigation-link"

export default function MobileMenu({ path }: { path: string }) {
  const open = useUi(state => state.overlay === "menu")
  const close = useUi(state => state.closeOverlay)
  return <Sheet open={open} onOpenChange={next => { if (!next && useUi.getState().overlay === "menu") close() }}>
    <SheetContent side="top" onCloseAutoFocus={restoreOverlayFocus} className="mobile-nav-sheet">
      <SheetTitle className="pl-3 pt-1 font-display text-2xl">Menu</SheetTitle>
      <SheetDescription className="sr-only">Navigate Vault &amp; Vein.</SheetDescription>
      <nav className="grid gap-1" aria-label="Mobile navigation">
        {navigation.map(({ href, label }, index) =>
          <NavigationLink key={href} href={href} onNavigate={close} style={{ animationDelay: index * 65 + "ms" }}
            aria-current={path === href || path.startsWith(href + "/") ? "page" : undefined} className="mobile-nav-link">{label}</NavigationLink>)}
      </nav>
      <EnquireButton className="pill-primary">Ask <ArrowUpRight size={16} aria-hidden="true" /></EnquireButton>
    </SheetContent>
  </Sheet>
}
