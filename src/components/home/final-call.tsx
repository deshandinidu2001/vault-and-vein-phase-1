"use client"

import { useRef } from "react"
import { photos } from "@/config/images"
import { site } from "@/config/site"
import { ResponsivePhoto } from "@/components/ui/responsive-photo"
import { EnquireButton } from "@/components/layout/enquire-button"
import { gsap, useGSAP } from "@/components/animation/motion-provider"

export function FinalCall() {
  const section = useRef<HTMLElement>(null)
  useGSAP(() => {
    const media = gsap.matchMedia()
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo("[data-cta-word]", { opacity: .2 }, { opacity: 1, ease: "none", stagger: .2,
        scrollTrigger: { trigger: section.current, start: "top 90%", end: "center 55%", scrub: true },
      })
    })
    return () => media.revert()
  }, { scope: section })

  return <section ref={section} className="section marble dark-panel">
    <div className="wrap film-grid">
      <div className="grid justify-items-start gap-6">
        <p className="eyebrow" data-reveal>Make time for a stone</p>
        <h2 aria-label="Ready when you are."><span aria-hidden="true"><span data-cta-word>Ready</span>{" "}<span data-cta-word>when</span><br /><span data-cta-word>you</span>{" "}<span data-cta-word>are.</span></span></h2>
        <EnquireButton className="pill-gold" />
        <p className="text-sm text-cream/80">{site.replyTime}</p>
      </div>
      <div className="photo aspect-[4/3]" data-image-reveal><ResponsivePhoto photo={photos.closing} sizes="(min-width: 768px) 50vw, 95vw" /></div>
    </div>
  </section>
}
