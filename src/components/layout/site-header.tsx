"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Menu, ShoppingBag } from "lucide-react"
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
  const [atTop, setAtTop] = useState(true)
  const [hidden, setHidden] = useState(false)
  const active = (href: string) => href === "/" ? path === "/" : path === href || path.startsWith(href + "/")

  useEffect(() => {
    let previous = window.scrollY
    const progress = document.getElementById("page-progress")
    const update = () => {
      const y = Math.max(0, window.scrollY)
      setAtTop(y < 48)
      if (Math.abs(y - previous) >= 5 || y < 48) {
        setHidden(y > 120 && y > previous)
        previous = y
      }
      const distance = document.documentElement.scrollHeight - window.innerHeight
      if (progress) progress.style.transform = "scaleX(" + (distance > 0 ? y / distance : 0) + ")"
    }
    setHidden(false)
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
    <header className="site-header" data-transparent={path === "/" && atTop} data-hidden={hidden && !overlay}>
      <div className="wrap header-row">
        <Link href="/" className="brand" aria-label="Vault & Vein home" translate="no">
          <BrandBadge /><span>VAULT &amp; VEIN</span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {navigation.map(({ href, label }) => <Link key={href} href={href} aria-current={active(href) ? "page" : undefined}>{label}</Link>)}
        </nav>
        <div className="header-actions">
          <EnquireButton className="header-enquiry">Enquire</EnquireButton>
          <button className="icon-button relative" aria-label={"Open cart, " + count + " stones"} onClick={openCart} type="button">
            <ShoppingBag size={20} aria-hidden="true" />
            {count > 0 && <span aria-hidden="true" className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-gold text-[10px] font-bold text-deep">{count}</span>}
          </button>
          <button className="currency-button" type="button" aria-label={"Currency " + currency + ". Switch currency"} onClick={toggleCurrency}>{currency}</button>
          <button className="icon-button mobile-menu" type="button" aria-label="Open menu" onClick={openMenu}><Menu size={20} aria-hidden="true" /></button>
        </div>
      </div>
      <div className="header-progress" aria-hidden="true"><div id="page-progress" /></div>
    </header>
    <Sheet open={overlay === "menu"} onOpenChange={(open) => { if (!open && useUi.getState().overlay === "menu") closeOverlay() }}>
      <SheetContent side="right" onCloseAutoFocus={restoreOverlayFocus} className="dark-panel mobile-nav-sheet w-full! max-w-none! p-8 pt-16">
        <SheetTitle className="sr-only">Main menu</SheetTitle>
        <SheetDescription className="sr-only">Navigate Vault &amp; Vein.</SheetDescription>
        <nav className="grid content-center flex-1" aria-label="Mobile navigation">
          {navigation.map(({ href, label }, index) => <motion.div key={href} initial={reduced ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : .45, delay: reduced ? 0 : .065 * index }}>
            <Link href={href} onClick={closeOverlay} aria-current={active(href) ? "page" : undefined} className="block border-b border-cream/20 py-4 font-display text-5xl hover:text-gold aria-[current=page]:text-gold">{label}</Link>
          </motion.div>)}
        </nav>
        <EnquireButton className="pill-gold mb-4">Enquire</EnquireButton>
      </SheetContent>
    </Sheet>
  </>
}
