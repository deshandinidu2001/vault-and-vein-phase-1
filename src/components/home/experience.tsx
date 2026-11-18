"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { GemViewer } from "@/components/three/gem-viewer"
import type { GemStage } from "@/components/three/gem-shape"
import { SectionHeading } from "@/components/ui/section-heading"
import { gsap, ScrollTrigger, useGSAP } from "@/components/animation/motion-provider"

const steps = [
  { title: "First, we source.", body: "We begin with the rough, looking for colour, character and material worth cutting.", stage: "Rough", tint: "#3e6b50" },
  { title: "Then, we cut.", body: "Proportions and facet placement determine how a stone shows its colour in the light.", stage: "Cut", tint: "#259371" },
  { title: "Finally, we certify.", body: "Where a laboratory report is available, we share it so you can review the findings for that stone.", stage: "Polished", tint: "#1cb883" },
] as const

export function Experience() {
  const scope = useRef<HTMLElement>(null)
  const [active, setActive] = useState<GemStage>(0)

  useGSAP(() => {
    const rows = gsap.utils.toArray<HTMLElement>("[data-stage]", scope.current)
    const update = () => {
      const midpoint = window.innerHeight * .54
      const closest = rows.reduce((previous, row, index) => {
        const delta = Math.abs(row.getBoundingClientRect().top + row.offsetHeight / 2 - midpoint)
        return delta < previous.delta ? { index, delta } : previous
      }, { index: 0, delta: Infinity })
      setActive(closest.index as GemStage)
    }
    const trigger = ScrollTrigger.create({ trigger: "#experience-steps", start: "top 80%", end: "bottom 20%", onUpdate: update, onRefresh: update })
    update()
    return () => trigger.kill()
  }, { scope })

  const step = steps[active]
  return (
    <section ref={scope} id="experience" className="section marble dark-panel">
      <div className="wrap film-grid experience-grid">
        <div className="experience-visual">
          <div className="relative aspect-[5/4] overflow-hidden rounded-3xl border border-cream/15 bg-deep/65 md:aspect-square">
            <div className="pointer-events-none absolute inset-[14%] rounded-full border border-gold/20" aria-hidden="true" />
            <GemViewer cut="Cushion" stage={active} tint={step.tint} label={step.stage + " stage of an illustrative gemstone"} />
            <p className="eyebrow absolute bottom-4 left-5">0{active + 1} / {step.stage}</p>
          </div>
        </div>
        <div className="grid gap-6">
          <SectionHeading eyebrow="The Vault & Vein way">What a stone can become.</SectionHeading>
          <p data-reveal>From an uneven piece of rough to a polished surface, every decision changes the way a stone meets the light.</p>
          <ol id="experience-steps" className="grid">
            {steps.map(({ title, body }, index) => <li key={title} data-stage data-active={active === index} className="experience-step">
              <span className="eyebrow tabular-nums" data-count={index + 1}>0{index + 1}</span>
              <div className="space-y-2"><h3>{title}</h3><p>{body}</p></div>
            </li>)}
          </ol>
          <Link href="/about" className="line-link w-fit">Read our story <ArrowRight size={19} aria-hidden="true" /></Link>
        </div>
      </div>
    </section>
  )
}
