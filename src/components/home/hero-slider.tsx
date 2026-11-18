"use client"

import { useRef, useState, type KeyboardEvent } from "react"
import Link from "next/link"
import { ArrowDown, ArrowRight, ArrowUpRight, BadgeCheck, Gem, Layers3, Sparkles } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { heroSlides } from "@/config/hero"
import { ResponsivePhoto } from "@/components/ui/responsive-photo"
import { EnquireButton } from "@/components/layout/enquire-button"

const features = [
  { title: "Sapphires", description: "Blue and padparadscha", icon: Gem },
  { title: "Spinel & Garnet", description: "Saturated colour", icon: Layers3 },
  { title: "Rare Finds", description: "Alexandrite and chrysoberyl", icon: Sparkles },
  { title: "Certified", description: "Lab reports where available", icon: BadgeCheck },
]

export function HeroSlider() {
  const reduced = useReducedMotion()
  const [current, setCurrent] = useState(0)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const slide = heroSlides[current]
  const total = heroSlides.length

  function slideIndex(index: number) {
    return (index + total) % total
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
    event.preventDefault()
    const next = slideIndex(current + (event.key === "ArrowLeft" ? -1 : 1))
    setCurrent(next)
    event.currentTarget.querySelectorAll("button")[next]?.focus()
  }

  return (
    <section className="home-masthead" aria-labelledby="hero-title">
      <div className="hero-panel">
        <div className="hero-intro">
          <p className="eyebrow hero-enter">Fine cut &amp; polished gemstones</p>
          <h1 id="hero-title"><span className="hero-mask"><span>Rarity,</span></span>{" "}<span className="hero-mask"><span>Revealed.</span></span></h1>
          <div className="hero-enter hero-actions-copy">
            <p>Discover gemstones with a point of view, inspired by Sri Lanka’s heritage of colour and craft.</p>
            <div className="hero-actions">
              <Link href="/shop" className="pill pill-primary">
                Explore the Collection <span className="action-disc"><ArrowUpRight size={18} aria-hidden="true" /></span>
              </Link>
              <EnquireButton className="hero-secondary">
                Enquire about a stone <span className="action-disc"><ArrowRight size={18} aria-hidden="true" /></span>
              </EnquireButton>
            </div>
          </div>
        </div>
        <div className="hero-media" role="region" aria-label="Featured collection images" aria-roledescription="carousel">
          <div className="hero-art"
            onTouchStart={(event) => {
              const touch = event.changedTouches[0]
              if (touch) touchStart.current = { x: touch.clientX, y: touch.clientY }
            }}
            onTouchEnd={(event) => {
              const start = touchStart.current
              const touch = event.changedTouches[0]
              touchStart.current = null
              if (!start || !touch) return
              const dx = touch.clientX - start.x
              const dy = touch.clientY - start.y
              if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
                setCurrent((index) => slideIndex(index + (dx < 0 ? 1 : -1)))
              }
            }}
            onTouchCancel={() => { touchStart.current = null }}>
            <AnimatePresence initial={false}>
              <motion.div key={slide.title} className="hero-frame"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: reduced ? 0 : .5, ease: "easeInOut" }}>
                <ResponsivePhoto photo={slide} sizes="(min-width: 900px) 56vw, calc(100vw - 24px)" priority={current === 0} />
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="hero-dots" role="group" aria-label="Choose an image" onKeyDown={onKeyDown}>
            {heroSlides.map((item, index) => (
              <button
                type="button"
                key={item.title}
                className="hero-dot"
                aria-label={"Show image " + (index + 1) + " of " + total + ": " + item.title}
                aria-pressed={current === index}
                onClick={() => setCurrent(index)}
              />
            ))}
          </div>
        </div>
      </div>
      <ul className="hero-features" aria-label="Collection highlights">
        {features.map(({ title, description, icon: Icon }) => (
          <li key={title}>
            <span className="hero-feature-icon"><Icon size={20} aria-hidden="true" /></span>
            <span><strong>{title}</strong><small>{description}</small></span>
          </li>
        ))}
      </ul>
      <a href="#collection" className="hero-scroll icon-button" aria-label="Scroll to the collection"><ArrowDown size={20} aria-hidden="true" /></a>
    </section>
  )
}
