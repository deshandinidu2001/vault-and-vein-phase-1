"use client"

import { useRef, useState, type KeyboardEvent } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react"
import { collection } from "@/config/collection"
import { ResponsivePhoto } from "@/components/ui/responsive-photo"
import { SectionHeading } from "@/components/ui/section-heading"
import { gsap, useGSAP, type ScrollTrigger } from "@/components/animation/motion-provider"

export function CollectionEdit() {
  const panel = useRef<HTMLDivElement>(null)
  const rail = useRef<HTMLUListElement>(null)
  const meter = useRef<HTMLSpanElement>(null)
  const pin = useRef<ScrollTrigger | null>(null)
  const [edges, setEdges] = useState({ start: true, end: false })

  useGSAP(() => {
    const track = rail.current
    const section = panel.current
    if (!track || !section) return
    const media = gsap.matchMedia()
    media.add("(min-width: 1024px) and (min-height: 760px) and (prefers-reduced-motion: no-preference)", () => {
      const travel = () => Math.max(0, track.scrollWidth - track.clientWidth)
      track.dataset.scrollDriven = "true"
      const tween = gsap.fromTo(track, { scrollLeft: 0 }, {
        scrollLeft: travel,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top 86px",
          end: () => "+=" + Math.max(travel(), Math.round(window.innerHeight * .6)),
          pin: true,
          pinSpacing: true,
          scrub: true,
          invalidateOnRefresh: true,
        },
      })
      pin.current = tween.scrollTrigger ?? null
      return () => {
        pin.current = null
        delete track.dataset.scrollDriven
      }
    })
    return () => media.revert()
  }, { scope: panel })

  function move(direction: number) {
    const track = rail.current
    const card = track?.firstElementChild
    if (!track || !card) return
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0
    const max = track.scrollWidth - track.clientWidth
    if (max <= 0) return
    const target = Math.min(max, Math.max(0, track.scrollLeft + direction * (card.clientWidth + gap)))
    const trigger = pin.current
    if (trigger?.isActive) {
      window.scrollTo({ top: trigger.start + (target / max) * (trigger.end - trigger.start), behavior: "smooth" })
    } else {
      track.scrollTo({ left: target, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })
    }
  }

  function keyboard(event: KeyboardEvent<HTMLUListElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
    event.preventDefault()
    move(event.key === "ArrowLeft" ? -1 : 1)
  }

  return (
    <section id="collection" className="wrap section" aria-label="The collection edit">
      <div ref={panel} className="collection-panel">
        <div className="collection-heading">
          <SectionHeading eyebrow="The collection edit">Colour worth keeping.<br />Stones worth knowing.</SectionHeading>
          <p>Browse four edits, from the colours of sapphire to stones chosen to work together.</p>
        </div>
        <ul ref={rail} className="collection-track" aria-label="Collection edits" tabIndex={0} onKeyDown={keyboard} onScroll={(event) => {
          const { scrollLeft, scrollWidth, clientWidth } = event.currentTarget
          const distance = scrollWidth - clientWidth
          const progress = distance > 0 ? Math.min(1, Math.max(0, scrollLeft / distance)) : 1
          if (meter.current) meter.current.style.transform = "scaleX(" + progress + ")"
          const start = scrollLeft <= 2
          const end = distance - scrollLeft <= 2
          setEdges((current) => current.start === start && current.end === end ? current : { start, end })
        }}>
          {collection.map((edit, index) => (
            <li key={edit.title} className="collection-tile">
              <div className="photo collection-tile-image">
                <ResponsivePhoto photo={edit.photo} sizes="(min-width: 1100px) 30vw, (min-width: 640px) 46vw, 78vw" />
                <span className="collection-tile-number" aria-hidden="true">0{index + 1}</span>
              </div>
              <h3>{edit.title}</h3>
              <p>{edit.description}</p>
              <Link className="line-link collection-tile-link" href={edit.href}>Browse these stones <ArrowUpRight size={18} aria-hidden="true" /></Link>
            </li>
          ))}
        </ul>
        <div className="collection-controls">
          <div className="collection-meter" aria-hidden="true"><span ref={meter} /></div>
          <button className="icon-button" type="button" aria-label="Previous collection" disabled={edges.start} onClick={() => move(-1)}><ArrowLeft size={20} aria-hidden="true" /></button>
          <button className="icon-button" type="button" aria-label="Next collection" disabled={edges.end} onClick={() => move(1)}><ArrowRight size={20} aria-hidden="true" /></button>
        </div>
      </div>
    </section>
  )
}
