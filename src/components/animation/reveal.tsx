"use client"

import { useRef, type ReactNode } from "react"
import { gsap, SplitText, useGSAP } from "./scroll-tools"

export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const scope = useRef<HTMLDivElement>(null)
  useGSAP(() => {
    const media = gsap.matchMedia()
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const splits = gsap.utils.toArray<HTMLElement>("[data-split]", scope.current).map((heading) =>
        SplitText.create(heading, {
          type: "lines", mask: "lines", autoSplit: true,
          onSplit: ({ lines }) => gsap.from(lines, {
            yPercent: 105, opacity: 0, stagger: .075, duration: .9, ease: "power3.out",
            scrollTrigger: { trigger: heading, start: "top 80%", once: true },
          }),
        }),
      )
      gsap.utils.toArray<HTMLElement>("[data-reveal]", scope.current).forEach((target) => {
        gsap.from(target, { y: 15, opacity: 0, duration: .7, ease: "power3.out",
          scrollTrigger: { trigger: target, start: "top 87%", once: true } })
      })
      gsap.utils.toArray<HTMLElement>("[data-count]", scope.current).forEach((target) => {
        const end = Number(target.dataset.count)
        const counter = { value: 0 }
        const render = () => { target.textContent = String(Math.round(counter.value)).padStart(2, "0") }
        gsap.fromTo(counter, { value: 0 }, {
          value: end, onUpdate: render, duration: .55,
          scrollTrigger: { trigger: target, start: "top 88%", once: true },
        })
      })
      gsap.utils.toArray<HTMLElement>("[data-image-reveal]", scope.current).forEach((target) => {
        gsap.from(target, { clipPath: "inset(0 0 14% 0 round 1.5rem)", opacity: .3, duration: 1.1,
          scrollTrigger: { trigger: target, start: "top 88%", once: true } })
      })
      gsap.utils.toArray<HTMLElement>("[data-parallax]", scope.current).forEach((target) => {
        const image = target.querySelector("img")
        if (image) gsap.fromTo(image, { yPercent: -4 }, { yPercent: 4, ease: "none",
          scrollTrigger: { trigger: target, start: "top bottom", end: "bottom top", scrub: true } })
      })
      return () => splits.forEach((split) => split.revert())
    })
    return () => media.revert()
  }, { scope })
  return <div className={className} ref={scope}>{children}</div>
}
