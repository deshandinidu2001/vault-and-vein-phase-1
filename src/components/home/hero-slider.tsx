"use client"

import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import Link from "next/link"
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, Gem, Layers3, Pause, Play, Sparkles } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { heroDuration, heroSlides } from "@/config/hero"
import { ResponsivePhoto } from "@/components/ui/responsive-photo"
import { EnquireButton } from "@/components/layout/enquire-button"
import { gsap, useGSAP } from "@/components/animation/motion-provider"

const ease = [.22, 1, .36, 1] as const
const number = (index: number) => String(index + 1).padStart(2, "0")
const features = [
  { title: "Sapphires", description: "Blue and padparadscha", icon: Gem },
  { title: "Spinel & Garnet", description: "Saturated colour", icon: Layers3 },
  { title: "Rare Finds", description: "Alexandrite and chrysoberyl", icon: Sparkles },
  { title: "Certified", description: "Lab reports where available", icon: BadgeCheck },
]

export function HeroSlider() {
  const reduced = useReducedMotion()
  const [current, setCurrent] = useState(0)
  const [hasChanged, setHasChanged] = useState(false)
  const [paused, setPaused] = useState(false)
  const [hover, setHover] = useState(false)
  const [focus, setFocus] = useState(false)
  const scene = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const elapsed = useRef(0)
  const progress = useRef<HTMLSpanElement>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const item = heroSlides[current]
  const total = heroSlides.length

  function select(index: number) {
    const next = (index + total) % total
    if (next === current) return
    elapsed.current = 0
    setHasChanged(true)
    setCurrent(next)
  }

  useEffect(() => {
    if (paused || hover || focus || reduced || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let frame = 0
    let previous: number | undefined
    const tick = (now: number) => {
      if (previous !== undefined) elapsed.current += Math.min(now - previous, 100)
      previous = now
      if (elapsed.current >= heroDuration) {
        elapsed.current = 0
        setHasChanged(true)
        setCurrent((index) => (index + 1) % total)
        return
      }
      if (progress.current) progress.current.style.transform = "scaleX(" + elapsed.current / heroDuration + ")"
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [current, focus, hover, paused, reduced, total])

  useGSAP(() => {
    const media = gsap.matchMedia()
    media.add("(min-width: 900px) and (prefers-reduced-motion: no-preference)", () => {
      gsap.to(".hero-scroll-image", { scale: 1.065, ease: "none",
        scrollTrigger: { trigger: panel.current, start: "top top", end: "bottom top", scrub: true } })
    })
    return () => media.revert()
  }, { scope: panel })

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault()
      select(current + (event.key === "ArrowLeft" ? -1 : 1))
    }
  }

  function moveImage(x: number, y: number) {
    scene.current?.style.setProperty("--hero-x", x + "px")
    scene.current?.style.setProperty("--hero-y", y + "px")
  }

  return (
    <section className="home-masthead" aria-labelledby="hero-title">
      <div ref={panel} className="hero-panel">
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
        <div className="hero-media" role="region" aria-label="Featured collection images" aria-roledescription="carousel"
          onKeyDown={onKeyDown}
          onFocusCapture={() => setFocus(true)}
          onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocus(false) }}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => { setHover(false); moveImage(0, 0) }}>
          <div className="hero-art"
            onPointerMove={(event) => {
              if (reduced || event.pointerType !== "mouse" || !window.matchMedia("(min-width: 1024px)").matches) return
              const bounds = event.currentTarget.getBoundingClientRect()
              moveImage((.5 - (event.clientX - bounds.left) / bounds.width) * 22, (.5 - (event.clientY - bounds.top) / bounds.height) * 20)
            }}
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
              if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) select(current + (dx < 0 ? 1 : -1))
            }}
            onTouchCancel={() => { touchStart.current = null }}>
            <div className="hero-scroll-image">
              <div ref={scene} className="hero-pointer-image">
                <AnimatePresence initial={false}>
                  <motion.div key={current} className="hero-frame" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: reduced ? .18 : 1.05, ease }}>
                    <motion.div className="absolute inset-0" initial={hasChanged && !reduced ? { scale: 1.08 } : false}
                      animate={{ scale: 1 }} transition={{ duration: reduced ? 0 : 1.1, ease }} style={{ transformOrigin: item.origin }}>
                      <ResponsivePhoto photo={item} sizes="(min-width: 900px) 61vw, calc(100vw - 24px)" priority={!hasChanged && current === 0} />
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
          <div className="hero-controls">
            <div className="hero-slide-copy">
              <div aria-live={paused || focus || reduced ? "polite" : "off"} aria-atomic="true">
                <div className="hero-caption" key={current}>
                  <p className="eyebrow">{number(current)} <span aria-hidden="true">/</span> {item.title}</p>
                  <p className="hero-caption-description">{item.caption}</p>
                </div>
              </div>
              <Link href={item.href} className="hero-slide-link" aria-label={"Explore " + item.title}>
                <ArrowUpRight size={19} aria-hidden="true" />
              </Link>
            </div>
            <div className="hero-slide-navigation">
              <div className="hero-indicators" role="group" aria-label="Choose a slide">
                {heroSlides.map((slide, index) => <button type="button" key={slide.title} className="hero-indicator"
                  aria-label={number(index) + " " + slide.title} aria-current={current === index ? "true" : undefined} onClick={() => select(index)}>
                  <span>{number(index)}</span>
                  <span className="hero-meter">{index === current && <span ref={progress} className="hero-meter-fill" />}</span>
                </button>)}
              </div>
              <div className="hero-controls-buttons">
                <button className="hero-slide-button" type="button" aria-label="Previous slide" onClick={() => select(current - 1)}><ArrowLeft size={17} aria-hidden="true" /></button>
                <button className="hero-slide-button" type="button" aria-label="Next slide" onClick={() => select(current + 1)}><ArrowRight size={17} aria-hidden="true" /></button>
                <button className="hero-slide-button" type="button" disabled={!!reduced} aria-label={paused ? "Resume slideshow" : "Pause slideshow"} onClick={() => setPaused(!paused)}>
                  {paused || reduced ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
                </button>
              </div>
            </div>
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
