"use client"

import { useEffect, useState, type KeyboardEvent } from "react"
import useEmblaCarousel from "embla-carousel-react"
import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { collection } from "@/config/collection"
import { ResponsivePhoto } from "@/components/ui/responsive-photo"
import { SectionHeading } from "@/components/ui/section-heading"

export function CollectionEdit() {
  const [viewport, api] = useEmblaCarousel({ loop: true, duration: 25, breakpoints: { "(prefers-reduced-motion: reduce)": { duration: 0 } } })
  const [current, setCurrent] = useState(0)
  useEffect(() => {
    if (!api) return
    const sync = () => setCurrent(api.selectedScrollSnap())
    sync()
    api.on("select", sync).on("reInit", sync)
    return () => { api.off("select", sync).off("reInit", sync) }
  }, [api])

  function keyboard(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault()
      if (event.key === "ArrowLeft") api?.scrollPrev()
      else api?.scrollNext()
    }
  }

  return (
    <section id="collection" className="wrap section space-y-8" aria-label="The collection edit" aria-roledescription="carousel" tabIndex={0} onKeyDown={keyboard}>
      <SectionHeading eyebrow="The collection edit">Colour worth keeping.<br />Stones worth knowing.</SectionHeading>
      <p data-reveal>Start with the kind of stone you’re drawn to. There’s more to discover once you look closely.</p>
      <div ref={viewport} className="overflow-hidden">
        <div className="flex touch-pan-y">
          {collection.map((edit, index) => (
            <article key={edit.title} aria-roledescription="slide" aria-label={(index + 1) + " of " + collection.length}
              aria-hidden={current !== index} className="film-grid min-w-0 flex-[0_0_100%]">
              <div className={"photo aspect-[4/3] " + (current === index ? "collection-image-active" : "")}>
                <ResponsivePhoto photo={edit.photo} sizes="(min-width: 768px) 50vw, 95vw" />
              </div>
              <div className={"grid gap-4 pb-3 md:p-5 " + (current === index ? "collection-text-active" : "opacity-0")}>
                <p className="eyebrow text-[#785520]">0{index + 1}</p>
                <h3>{edit.title}</h3>
                <p>{edit.description}</p>
                <ul className="list-disc space-y-1 pl-5 marker:text-[#8a6627]">{edit.points.map((point) => <li key={point}>{point}</li>)}</ul>
                <Link className="line-link w-fit" href={edit.href} tabIndex={current === index ? undefined : -1}>Browse these stones <ArrowRight size={19} aria-hidden="true" /></Link>
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-emerald/15 pt-4">
        <p className="eyebrow tabular-nums" aria-live="polite">0{current + 1} / 0{collection.length}</p>
        <div className="flex gap-2">
          <button className="icon-button" type="button" aria-label="Previous collection" disabled={!api} onClick={() => api?.scrollPrev()}><ArrowLeft size={20} aria-hidden="true" /></button>
          <button className="icon-button" type="button" aria-label="Next collection" disabled={!api} onClick={() => api?.scrollNext()}><ArrowRight size={20} aria-hidden="true" /></button>
        </div>
      </div>
    </section>
  )
}
