"use client"

import { NavigationLink } from "./navigation-link"
import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"
import { ArrowUp, ArrowUpRight } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { site } from "@/config/site"
import { BrandBadge } from "./site-header"
import { EnquireButton } from "./enquire-button"

const groups = [
  { title: "Learn", links: [{ href: "/about", label: "About" }, { href: "/about#care", label: "Care guide" }, { href: "/#faq", label: "FAQ" }] },
  { title: "Policies", links: [{ href: "/shipping", label: "Shipping" }, { href: "/returns", label: "Returns" }, { href: "/privacy", label: "Privacy" }, { href: "/terms", label: "Terms" }] },
]

export function SiteFooter({ shopLinks }: { shopLinks: { href: string; label: string }[] }) {
  const footer = useRef<HTMLElement>(null)
  const wordmark = useRef<HTMLDivElement>(null)
  const path = usePathname()
  const animate = useMediaQuery("(prefers-reduced-motion: no-preference)")

  useEffect(() => {
    const element = footer.current
    const surface = element?.parentElement?.querySelector(":scope > .site-page-surface")
    const mark = wordmark.current
    if (!animate || !element || !surface || !mark) return
    const updateFill = () => {
      const box = mark.getBoundingClientRect()
      const sticky = getComputedStyle(element).position === "sticky"
      const surfaceBottom = surface.getBoundingClientRect().bottom
      const distanceAfterReveal = sticky
        ? box.top - surfaceBottom
        : window.innerHeight - box.bottom
      const footerBox = element.getBoundingClientRect()
      const availableScroll = sticky ? box.top - footerBox.top : footerBox.bottom - box.bottom
      const leadIn = 12
      const fillDistance = Math.max(1, Math.min(112, availableScroll - leadIn))
      const atEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2
      const progress = atEnd ? 1 : (distanceAfterReveal - leadIn) / fillDistance
      mark.style.setProperty("--footer-fill", (Math.min(1, Math.max(0, progress)) * 100).toFixed(2) + "%")
      const revealed = (window.innerHeight - surfaceBottom) / Math.max(1, Math.min(window.innerHeight * .85, footerBox.height))
      element.style.setProperty("--footer-rise", String(1 - Math.max(0, Math.min(1, revealed))))
    }

    let frame = 0
    const scheduleFill = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        updateFill()
      })
    }
    const updateLayout = () => {
      const headerHeight = document.querySelector(".site-header")?.getBoundingClientRect().height ?? 0
      const topPadding = parseFloat(getComputedStyle(element).paddingTop)
      // A tall footer stays in the document flow so all its links can scroll into view.
      element.toggleAttribute("data-reveal-sticky", element.offsetHeight - topPadding <= window.innerHeight - headerHeight - 16)
      scheduleFill()
    }
    const resize = new ResizeObserver(updateLayout)
    resize.observe(surface)
    resize.observe(mark)
    resize.observe(element)
    window.addEventListener("scroll", scheduleFill, { passive: true })
    window.addEventListener("resize", updateLayout)
    updateLayout()
    updateFill()

    return () => {
      resize.disconnect()
      window.removeEventListener("scroll", scheduleFill)
      window.removeEventListener("resize", updateLayout)
      cancelAnimationFrame(frame)
      element.removeAttribute("data-reveal-sticky")
      element.style.removeProperty("--footer-rise")
      mark.style.removeProperty("--footer-fill")
    }
  }, [animate, path])

  return (
    <footer ref={footer} className="site-footer dark-panel" onFocusCapture={(event) => {
      if (!event.target.matches(":focus-visible") || getComputedStyle(event.currentTarget).position !== "sticky") return
      const surface = event.currentTarget.parentElement?.querySelector(":scope > .site-page-surface")
      if (surface && event.target.getBoundingClientRect().top < surface.getBoundingClientRect().bottom) {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" })
      }
    }}>
      <div className="wrap footer-inner">
        <div className="footer-intro" data-footer-rise>
          <div>
            <NavigationLink href="/" className="footer-brand" aria-label={site.tagline + " Vault & Vein home"}>
              <BrandBadge size={48} /><span>{site.tagline}</span>
            </NavigationLink>
            <p className="mt-3 text-sm text-cream/80">Inspired by Sri Lankan gemstone heritage</p>
          </div>
          <EnquireButton className="footer-enquiry pill-gold">
            Ask about a stone
            <span className="action-disc"><ArrowUpRight size={20} aria-hidden="true" /></span>
          </EnquireButton>
        </div>
        <div className="footer-nav" data-footer-rise>
          {[{ title: "Shop", links: shopLinks }, ...groups].map(({ title, links }) => <nav key={title} aria-label={title} className="grid content-start">
            <p className="eyebrow mb-2">{title}</p>
            <ul>
              {links.map(({ href, label }) => <li key={href}><NavigationLink href={href} className="footer-link">{label}</NavigationLink></li>)}
            </ul>
          </nav>)}
        </div>
        <div ref={wordmark} className="footer-wordmark">
          <p translate="no">Vault &amp; Vein</p>
          <p className="footer-wordmark-fill" translate="no" aria-hidden="true">Vault &amp; Vein</p>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getUTCFullYear()} Vault &amp; Vein</p>
          <button type="button" className="footer-link gap-3" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })}>
            Back to top <ArrowUp size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  )
}
