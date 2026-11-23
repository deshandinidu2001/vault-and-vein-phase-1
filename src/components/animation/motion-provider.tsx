"use client"

import { useEffect, type ReactNode } from "react"
import type Lenis from "lenis"
import { useMediaQuery } from "@/hooks/use-media-query"
import "lenis/dist/lenis.css"

export function MotionProvider({ children }: { children: ReactNode }) {
  const animate = useMediaQuery("(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)")
  useEffect(() => {
    if (!animate) return
    let active = true
    let scroll: Lenis | undefined
    void import("lenis").then(({ default: SmoothScroll }) => {
      if (active) scroll = new SmoothScroll({ autoRaf: true, anchors: { offset: -96 }, allowNestedScroll: true })
    }, () => { /* Native scrolling remains available. */ })
    return () => {
      active = false
      scroll?.destroy()
    }
  }, [animate])

  return children
}
