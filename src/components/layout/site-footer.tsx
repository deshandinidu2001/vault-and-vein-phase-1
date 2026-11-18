"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRef } from "react"
import { ArrowUp, ArrowUpRight } from "lucide-react"
import { gsap, ScrollTrigger, useGSAP } from "@/components/animation/motion-provider"
import { gemLinks, site } from "@/config/site"
import { BrandBadge } from "./site-header"
import { EnquireButton } from "./enquire-button"

const groups = [
  { title: "Shop", links: gemLinks },
  { title: "Learn", links: [{ href: "/about", label: "About" }, { href: "/about#care", label: "Care guide" }, { href: "/#faq", label: "FAQ" }] },
  { title: "Policies", links: [{ href: "/shipping", label: "Shipping" }, { href: "/returns", label: "Returns" }, { href: "/privacy", label: "Privacy" }, { href: "/terms", label: "Terms" }] },
]

export function SiteFooter() {
  const footer = useRef<HTMLElement>(null)
  const wordmark = useRef<HTMLDivElement>(null)
  const path = usePathname()

  useGSAP(() => {
    const element = footer.current
    const surface = element?.previousElementSibling
    const mark = wordmark.current
    if (!element || !surface || !mark) return
    const media = gsap.matchMedia()

    media.add("(prefers-reduced-motion: no-preference)", () => {
      const updateFill = () => {
        const box = mark.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const entry = Math.min(42, box.height * .14)
        let progress: number

        if (getComputedStyle(element).position === "sticky") {
          // The page surface covers the wordmark until it scrolls out of the way.
          const edge = surface.getBoundingClientRect().bottom
          const start = Math.min(viewportHeight, box.bottom) - entry
          const end = Math.max(0, box.top - Math.min(144, box.height * .45))
          progress = (start - edge) / Math.max(1, start - end)
        } else {
          // In normal flow the mark enters from the bottom of the viewport.
          const tail = element.getBoundingClientRect().bottom - box.bottom
          const distance = box.height + Math.min(88, Math.max(0, tail)) - entry
          progress = (viewportHeight - box.top - entry) / Math.max(1, distance)
        }

        mark.style.setProperty("--footer-fill", (gsap.utils.clamp(0, 1, progress) * 100).toFixed(2) + "%")
      }

      ScrollTrigger.create({
        trigger: surface,
        start: "bottom bottom",
        end: "max",
        onUpdate: updateFill,
        onRefresh: updateFill,
      })
      updateFill()

      gsap.from("[data-footer-rise]", {
        y: 22,
        opacity: .72,
        stagger: .12,
        ease: "power2.out",
        scrollTrigger: {
          trigger: surface,
          start: "bottom bottom",
          end: () => "+=" + Math.max(1, Math.min(window.innerHeight * .85, element.offsetHeight)),
          scrub: .28,
          invalidateOnRefresh: true,
        },
      })
      return () => { mark.style.removeProperty("--footer-fill") }
    })
    return () => media.revert()
  }, { scope: footer, dependencies: [path], revertOnUpdate: true })

  return (
    <footer ref={footer} className="site-footer dark-panel" onFocusCapture={(event) => {
      if (!event.target.matches(":focus-visible") || getComputedStyle(event.currentTarget).position !== "sticky") return
      const surface = event.currentTarget.previousElementSibling
      if (surface && event.target.getBoundingClientRect().top < surface.getBoundingClientRect().bottom) {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" })
      }
    }}>
      <div className="wrap footer-inner">
        <div className="footer-intro" data-footer-rise>
          <div>
            <Link href="/" className="footer-brand" aria-label="Vault & Vein home">
              <BrandBadge size={48} /><span>{site.tagline}</span>
            </Link>
            <p className="mt-3 text-sm text-cream/80">Inspired by Sri Lankan gemstone heritage</p>
          </div>
          <EnquireButton className="footer-enquiry pill-gold">
            Enquire about a stone
            <span className="action-disc"><ArrowUpRight size={20} aria-hidden="true" /></span>
          </EnquireButton>
        </div>
        <div className="footer-nav" data-footer-rise>
          {groups.map(({ title, links }) => <nav key={title} aria-label={title} className="grid content-start">
            <p className="eyebrow mb-2">{title}</p>
            <ul>
              {links.map(({ href, label }) => <li key={href}><Link href={href} className="footer-link">{label}</Link></li>)}
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
