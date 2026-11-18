"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { ArrowUpRight, Menu, ShoppingBag } from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"
import { useCart } from "@/store/cart"
import { navigation } from "@/config/site"
import { useUi, restoreOverlayFocus } from "@/store/ui"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { EnquireButton } from "./enquire-button"

export function BrandBadge({ size = 40 }: { size?: number }) {
  return <span className="grid shrink-0 place-items-center overflow-hidden rounded-full" style={{ width: size, height: size }}>
    <Image src="/brand/logo-badge.jpeg" width={size} height={size} sizes={size + "px"} alt="" className="scale-[1.13]" />
  </span>
}

export function SiteHeader() {
  const count = useCart((state) => state.items.length)
  const path = usePathname()
  const reduced = useReducedMotion()
  const { overlay, openMenu, openCart, closeOverlay, currency, toggleCurrency } = useUi()
  const [compact, setCompact] = useState(false)
  const progress = useRef<HTMLDivElement>(null)
  const active = (href: string) => href === "/" ? path === "/" : path === href || path.startsWith(href + "/")

  useEffect(() => {
    const update = () => {
      const y = Math.max(0, window.scrollY)
      setCompact((current) => current ? y > 24 : y > 56)
      const distance = document.documentElement.scrollHeight - window.innerHeight
      if (progress.current) progress.current.style.transform = "scaleX(" + (distance > 0 ? Math.min(1, y / distance) : 0) + ")"
    }
    update()
    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    return () => {
      window.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [path])

  return <>
    <a href="#main" className="fixed left-4 top-4 z-[70] -translate-y-24 rounded-full bg-cream px-4 py-3 text-deep focus:translate-y-0">Skip to content</a>
    <header className="site-header" data-compact={compact}>
      <div className="header-row">
        <Link href="/" className="brand" aria-label="Vault & Vein home" translate="no">
          <BrandBadge size={33} /><span>VAULT &amp; VEIN</span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {navigation.map(({ href, label }) => <Link key={href} href={href} aria-current={active(href) ? "page" : undefined}>{label}</Link>)}
        </nav>
        <div className="header-actions">
          <EnquireButton className="header-enquiry pill-primary">
            Enquire
            <span className="action-disc"><ArrowUpRight size={16} aria-hidden="true" /></span>
          </EnquireButton>
          <button className="icon-button relative" aria-label={"Open cart, " + count + " stones"} onClick={openCart} type="button">
            <ShoppingBag size={20} aria-hidden="true" />
            {count > 0 && <span aria-hidden="true" className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-gold text-[10px] font-bold text-deep">{count}</span>}
          </button>
          <button className="currency-button" type="button" aria-label={"Currency " + currency + ". Switch currency"} onClick={toggleCurrency}>{currency}</button>
          <button className="icon-button mobile-menu" type="button" aria-label="Open menu" aria-haspopup="dialog" aria-expanded={overlay === "menu"} onClick={openMenu}><Menu size={20} aria-hidden="true" /></button>
        </div>
        <div className="header-progress" aria-hidden="true"><div ref={progress} /></div>
      </div>
    </header>
    <Sheet open={overlay === "menu"} onOpenChange={(open) => { if (!open && useUi.getState().overlay === "menu") closeOverlay() }}>
      <SheetContent side="top" onCloseAutoFocus={restoreOverlayFocus} className="mobile-nav-sheet">
        <SheetTitle className="pl-3 pt-1 font-display text-2xl">Menu</SheetTitle>
        <SheetDescription className="sr-only">Navigate Vault &amp; Vein.</SheetDescription>
        <nav className="grid gap-1" aria-label="Mobile navigation">
          {navigation.map(({ href, label }, index) => <motion.div key={href} initial={reduced ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : .45, delay: reduced ? 0 : .065 * index }}>
            <Link href={href} onClick={closeOverlay} aria-current={active(href) ? "page" : undefined} className="mobile-nav-link">{label}</Link>
          </motion.div>)}
        </nav>
        <EnquireButton className="pill-primary">
          Enquire <ArrowUpRight size={16} aria-hidden="true" />
        </EnquireButton>
      </SheetContent>
    </Sheet>
  </>
}
