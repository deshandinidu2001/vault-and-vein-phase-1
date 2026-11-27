"use client"

import Image from "next/image"
import dynamic from "next/dynamic"
import { NavigationLink } from "./navigation-link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { ArrowUpRight, Menu, ShoppingBag } from "lucide-react"
import { useCart } from "@/store/cart"
import { navigation } from "@/config/site"
import { useUi } from "@/store/ui"
import { EnquireButton } from "./enquire-button"

const MobileMenu = dynamic(() => import("./mobile-menu"))

export function BrandBadge({ size = 40 }: { size?: number }) {
  return <span className="grid shrink-0 place-items-center overflow-hidden rounded-full" style={{ width: size, height: size }}>
    <Image src="/brand/logo-badge.jpeg" width={size} height={size} sizes={size + "px"} alt="" className="scale-[1.13]" />
  </span>
}

export function SiteHeader() {
  const count = useCart((state) => state.items.length)
  const path = usePathname()
  const { overlay, menuOpened, openMenu, openCart, currency, usdRate, toggleCurrency } = useUi()
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
        <NavigationLink href="/" className="brand" aria-label="Vault & Vein home" translate="no">
          <BrandBadge size={33} /><span>VAULT &amp; VEIN</span>
        </NavigationLink>
        <nav className="desktop-nav" aria-label="Main navigation">
          {navigation.map(({ href, label }) => <NavigationLink key={href} href={href} aria-current={active(href) ? "page" : undefined}>{label}</NavigationLink>)}
        </nav>
        <div className="header-actions">
          <EnquireButton className="header-enquiry pill-primary">
            Ask
            <span className="action-disc"><ArrowUpRight size={16} aria-hidden="true" /></span>
          </EnquireButton>
          <button className="icon-button relative" aria-label={"Open cart, " + count + " stones"} onClick={openCart} type="button">
            <ShoppingBag size={20} aria-hidden="true" />
            {count > 0 && <span aria-hidden="true" className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-gold text-[10px] font-bold text-deep">{count}</span>}
          </button>
          <button className="currency-button" type="button" disabled={!usdRate}
            aria-label={usdRate ? "Currency " + currency + ". Switch currency" : "Currency LKR only"}
            onClick={toggleCurrency}>{currency}</button>
          <button className="icon-button mobile-menu" type="button" aria-label="Open menu" aria-haspopup="dialog" aria-expanded={overlay === "menu"} onClick={openMenu}><Menu size={20} aria-hidden="true" /></button>
        </div>
        <div className="header-progress" aria-hidden="true"><div ref={progress} /></div>
      </div>
    </header>
    {menuOpened && <MobileMenu path={path} />}
  </>
}
