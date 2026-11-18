"use client"

import { useEffect, type ReactNode } from "react"
import Lenis from "lenis"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { SplitText } from "gsap/SplitText"
import { useGSAP } from "@gsap/react"
import { MotionConfig } from "framer-motion"
import "lenis/dist/lenis.css"

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP)
export { gsap, ScrollTrigger, SplitText, useGSAP }

export function MotionProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)")
    let stop = () => {}
    const start = () => {
      stop()
      if (preference.matches) return
      const lenis = new Lenis({ anchors: { offset: -96 }, allowNestedScroll: true })
      const frame = (time: number) => lenis.raf(time * 1000)
      lenis.on("scroll", ScrollTrigger.update)
      gsap.ticker.add(frame)
      stop = () => {
        gsap.ticker.remove(frame)
        lenis.destroy()
      }
    }
    start()
    preference.addEventListener("change", start)
    return () => {
      preference.removeEventListener("change", start)
      stop()
    }
  }, [])

  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
