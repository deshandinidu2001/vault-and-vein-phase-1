"use client"

import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import Link from "next/link"
import { ArrowDown, ArrowLeft, ArrowRight, Pause, Play } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { heroDuration, heroSlides } from "@/config/hero"
import { ResponsivePhoto } from "@/components/ui/responsive-photo"
import { EnquireButton } from "@/components/layout/enquire-button"
import { gsap, useGSAP } from "@/components/animation/motion-provider"

const ease = [.22, 1, .36, 1] as const
const number = (index: number) => String(index + 1).padStart(2, "0")
const features = [
  ["Sapphires", "Blue and padparadscha"],
  ["Spinel & Garnet", "Saturated colour"],
  ["Rare Finds", "Alexandrite and chrysoberyl"],
  ["Certified", "Lab reports where available"],
]

export function HeroSlider() {
  const reduced = useReducedMotion()
  const [current, setCurrent] = useState(0)
  const [hasChanged, setHasChanged] = useState(false)
  const [paused, setPaused] = useState(false)
  const [hover, setHover] = useState(false)
  const [focus, setFocus] = useState(false)
  const scene = useRef<HTMLDivElement>(null)
  const section = useRef<HTMLElement>(null)
  const elapsed = useRef(0)
  const progress = useRef<HTMLSpanElement>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const item = heroSlides[current]
  const total = heroSlides.length

  function select(index: number) {
    elapsed.current = 0
    if (progress.current) progress.current.style.transform = "scaleX(0)"
    setHasChanged(true)
    setCurrent((index + total) % total)
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
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const scrollTrigger = { trigger: section.current, start: "top top", end: "bottom top", scrub: true }
      gsap.to(".hero-scroll-image", { scale: 1.08, ease: "none", scrollTrigger })
      gsap.to(".hero-intro", { y: -48, opacity: 0, ease: "none",
        scrollTrigger: { ...scrollTrigger, end: "65% top" } })
    })
    return () => media.revert()
  }, { scope: section })

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
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
    <section ref={section} className="hero dark-panel" aria-label="Vault & Vein collections" aria-roledescription="carousel" tabIndex={0}
      onKeyDown={onKeyDown}
      onFocusCapture={() => setFocus(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocus(false) }}
      onPointerMove={(event) => {
        if (reduced || event.pointerType !== "mouse" || !window.matchMedia("(min-width: 1024px)").matches) return
        const bounds = event.currentTarget.getBoundingClientRect()
        moveImage((.5 - (event.clientX - bounds.left) / bounds.width) * 26, (.5 - (event.clientY - bounds.top) / bounds.height) * 24)
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); moveImage(0, 0) }}
      onTouchStart={(event) => { const touch = event.changedTouches[0]; touchStart.current = { x: touch.clientX, y: touch.clientY } }}
      onTouchEnd={(event) => {
        if (!touchStart.current) return
        const touch = event.changedTouches[0]
        const dx = touch.clientX - touchStart.current.x
        const dy = touch.clientY - touchStart.current.y
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) select(current + (dx < 0 ? 1 : -1))
        touchStart.current = null
      }}>
      <div className="hero-scroll-image" aria-hidden="true">
        <div ref={scene} className="hero-pointer-image">
          <AnimatePresence initial={false}>
            <motion.div key={current} className="hero-frame" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: reduced ? .2 : 1.2, ease }}>
              <motion.div className={hasChanged ? "absolute inset-0" : "hero-first-image absolute inset-0"}
                initial={hasChanged && !reduced ? { scale: 1.08 } : false} animate={{ scale: 1 }}
                transition={{ duration: reduced ? 0 : 1.2, ease }} style={{ transformOrigin: item.origin }}>
                <ResponsivePhoto photo={item} sizes="100vw" priority={!hasChanged && current === 0} />
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <div className="hero-shade" aria-hidden="true" />
      <div className="wrap hero-inner">
        <div className="hero-intro">
          <p className="eyebrow hero-enter">Fine cut &amp; polished gemstones</p>
          <h1><span className="hero-mask"><span>Rarity,</span></span><span className="hero-mask"><span>Revealed.</span></span></h1>
          <div className="hero-enter hero-actions-copy">
            <p>Discover gemstones with a point of view, inspired by Sri Lanka’s heritage of colour and craft.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/shop" className="pill pill-gold">Explore the Collection</Link>
              <EnquireButton />
            </div>
          </div>
        </div>
        <div className="hero-controls">
          <div aria-live={paused || focus || reduced ? "polite" : "off"} aria-atomic="true">
            <div className="overflow-hidden" key={current}>
              <div className="hero-caption">
                <p className="eyebrow">{number(current)} <span aria-hidden="true">/</span> {item.title}</p>
                <p>{item.caption}</p>
                <Link href={item.href} className="line-link text-sm">Explore this edit <ArrowRight size={17} aria-hidden="true" /></Link>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button className="icon-button" type="button" aria-label="Previous slide" onClick={() => select(current - 1)}><ArrowLeft size={20} aria-hidden="true" /></button>
            <button className="icon-button" type="button" aria-label="Next slide" onClick={() => select(current + 1)}><ArrowRight size={20} aria-hidden="true" /></button>
            <button className="icon-button" type="button" disabled={!!reduced} aria-label={paused ? "Resume slideshow" : "Pause slideshow"} onClick={() => setPaused(!paused)}>{paused || reduced ? <Play size={18} aria-hidden="true" /> : <Pause size={18} aria-hidden="true" />}</button>
            <span className="pl-1 text-xs tabular-nums">{number(current)} / {number(total - 1)}</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5" aria-label="Choose a slide">
            {heroSlides.map((slide, index) => <button type="button" key={slide.title} className="hero-indicator"
              aria-label={number(index) + " " + slide.title} aria-current={current === index ? "true" : undefined} onClick={() => select(index)}>
              <span>{number(index)}</span><span className="hero-meter">
                {index === current && <span ref={progress} className="hero-meter-fill" />}
              </span>
            </button>)}
          </div>
        </div>
        <a href="#collection" className="hero-scroll icon-button" aria-label="Scroll to the collection"><ArrowDown size={20} aria-hidden="true" /></a>
      </div>
      <ul className="wrap hero-features">
        {features.map(([title, description]) => <li key={title}><strong>{title}</strong><span>{description}</span></li>)}
      </ul>
    </section>
  )
}
