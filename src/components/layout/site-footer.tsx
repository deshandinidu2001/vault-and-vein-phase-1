"use client"

import Link from "next/link"
import { ArrowUp } from "lucide-react"
import { gemLinks, site } from "@/config/site"
import { BrandBadge } from "./site-header"

const groups = [
  { title: "Shop", links: gemLinks },
  { title: "Learn", links: [{ href: "/about", label: "About" }, { href: "/about#care", label: "Care guide" }, { href: "/#faq", label: "FAQ" }] },
  { title: "Policies", links: [{ href: "/shipping", label: "Shipping" }, { href: "/returns", label: "Returns" }, { href: "/privacy", label: "Privacy" }, { href: "/terms", label: "Terms" }] },
]

export function SiteFooter() {
  return (
    <footer className="dark-panel bg-deep">
      <div className="wrap pb-8 pt-16 md:pt-24">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-4" aria-label="Vault & Vein home"><BrandBadge size={48} /><span>{site.tagline}</span></Link>
          <button type="button" className="icon-button" aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })}><ArrowUp size={20} aria-hidden="true" /></button>
        </div>
        <div className="grid grid-cols-2 gap-8 py-12 sm:grid-cols-3">
          {groups.map(({ title, links }) => <nav key={title} aria-label={title} className="grid content-start">
            <p className="eyebrow mb-2">{title}</p>
            {links.map(({ href, label }) => <Link key={href} href={href} className="flex min-h-11 w-fit items-center text-sm hover:text-gold">{label}</Link>)}
          </nav>)}
        </div>
        <p className="footer-wordmark" translate="no">Vault &amp; Vein</p>
        <div className="flex flex-wrap justify-between gap-3 border-t border-cream/20 pt-6 text-sm text-cream/80">
          <p>Inspired by Sri Lankan gemstone heritage</p>
          <p>© {new Date().getUTCFullYear()} Vault &amp; Vein</p>
        </div>
      </div>
    </footer>
  )
}
