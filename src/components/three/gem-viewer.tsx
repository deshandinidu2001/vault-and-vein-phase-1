"use client"

import dynamic from "next/dynamic"
import { Component, useEffect, useState, type ReactNode } from "react"
import { RotateCcw, RotateCw } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { GemArt } from "./gem-art"
import type { GemCut, GemStage } from "./gem-shape"

const GemCanvas = dynamic(() => import("./gem-canvas"), { ssr: false })

class CanvasBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

export function GemViewer({ cut, tint, label, stage = 2, interactive = false }: {
  cut: GemCut; tint: string; label: string; stage?: GemStage; interactive?: boolean
}) {
  const desktop = useMediaQuery("(min-width: 768px) and (pointer: fine)")
  const [capable, setCapable] = useState(false)
  const [angle, setAngle] = useState(0)
  useEffect(() => {
    if (!desktop) return
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
    if ((nav.deviceMemory ?? 8) <= 4 || (nav.hardwareConcurrency || 8) <= 4 || nav.connection?.saveData) return
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: true })
    if (context) {
      context.getExtension("WEBGL_lose_context")?.loseContext()
      setCapable(true)
    }
  }, [desktop])

  const fallback = <div className="absolute inset-4"><GemArt cut={cut} tint={tint} stage={stage} label={label} sizes="(min-width: 768px) 45vw, 90vw" /></div>
  const canRender = desktop && capable
  return <div className="absolute inset-0">
    {!canRender ? fallback : <CanvasBoundary fallback={fallback}>
      <div className="size-full" role="img" aria-label={label}>
        <GemCanvas cut={cut} tint={tint} stage={stage} interactive={interactive} angle={angle} fallback={fallback} />
      </div>
      {interactive && <div className="viewer-controls absolute bottom-4 left-4 flex gap-2">
        <button type="button" className="icon-button" aria-label="Rotate gem left" onClick={() => setAngle((value) => value - Math.PI / 6)}><RotateCcw size={18} aria-hidden="true" /></button>
        <button type="button" className="icon-button" aria-label="Rotate gem right" onClick={() => setAngle((value) => value + Math.PI / 6)}><RotateCw size={18} aria-hidden="true" /></button>
      </div>}
    </CanvasBoundary>}
  </div>
}
