"use client"

import Link from "next/link"
import { useRef, useState } from "react"
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { SectionHeading } from "@/components/ui/section-heading"
import { GemArt } from "@/components/three/gem-art"
import { useUi } from "@/store/ui"
import { formatPrice } from "@/lib/pricing"
import { gemNames, type Stone } from "@/types/stone"

const filters = [["all", "All"], ["sapphire", "Sapphire"], ["spinel", "Spinel"], ["garnet", "Garnet"], ["rare", "Rare"]] as const
type Filter = (typeof filters)[number][0]

export function GemGallery({ stones }: { stones: Stone[] }) {
  const [filter, setFilter] = useState<Filter>("all")
  const [selected, setSelected] = useState<string | null>(null)
  const [railEdges, setRailEdges] = useState({ start: true, end: false })
  const rail = useRef<HTMLUListElement>(null)
  const openingButton = useRef<HTMLButtonElement>(null)
  const reduced = useReducedMotion()
  const currency = useUi((state) => state.currency)
  const openEnquiry = useUi((state) => state.openEnquiry)
  const visible = stones.filter((stone) => filter === "all" || (filter === "rare"
    ? stone.collections.includes("rare") : stone.gem_type === filter))
  const selection = visible.findIndex(({ slug }) => slug === selected)
  const stone = visible[selection]

  function move(offset: number) {
    if (visible.length > 1) setSelected(visible[(selection + offset + visible.length) % visible.length].slug)
  }

  function moveRail(direction: number) {
    const track = rail.current
    const firstCard = track?.firstElementChild
    if (!track || !firstCard) return
    const gap = parseFloat(window.getComputedStyle(track).columnGap) || 0
    track.scrollBy({ left: direction * (firstCard.clientWidth + gap), behavior: reduced ? "instant" : "smooth" })
  }

  return (
    <section id="gallery" className="section dark-panel">
      <div className="wrap space-y-8">
        <div className="gallery-intro">
          <SectionHeading eyebrow="The gem gallery">Find your next<br />signature stone.</SectionHeading>
          <p className="text-cream/80" data-reveal>Explore the cuts and colour families in our sample collection. Select a stone to see its details.</p>
        </div>
        <ToggleGroup type="single" aria-label="Filter gallery by gem type" value={filter}
          onValueChange={(value) => {
            if (!value) return
            setFilter(value as Filter)
            rail.current?.scrollTo({ left: 0, behavior: "instant" })
            setRailEdges({ start: true, end: false })
          }} className="flex flex-wrap gap-2">
          {filters.map(([value, label]) => <ToggleGroupItem key={value} value={value} className="h-auto min-h-12 min-w-12 rounded-full! border border-cream/30 px-4 text-cream hover:bg-cream/15 hover:text-cream data-[state=on]:bg-gold data-[state=on]:text-deep">{label}</ToggleGroupItem>)}
        </ToggleGroup>
        <ul ref={rail} className="gallery-rail" aria-label="Sample gems" onScroll={(event) => {
          const track = event.currentTarget
          const start = track.scrollLeft < 2
          const end = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2
          setRailEdges((current) => current.start === start && current.end === end ? current : { start, end })
        }}>
          <AnimatePresence initial={false}>
            {visible.map((item, index) => <motion.li key={item.id} layout={!reduced}
              initial={{ opacity: 0, y: reduced ? 0 : 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .3, delay: reduced ? 0 : Math.min(index, 5) * .06 }} className="gallery-card">
              <div className="stone-art">
                <GemArt cut={item.cut} tint={item.tint} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 76vw"
                  label={"Illustration of " + item.name} />
              </div>
              <div className="grid content-start gap-2 pt-4">
                <p className="eyebrow">{gemNames[item.gem_type]}</p>
                <h3 className="text-[clamp(1.6rem,2.5vw,2.2rem)]">{item.name}</h3>
                <p className="text-sm text-cream/80">{item.cut} <span aria-hidden="true">·</span> {item.carat} ct <span aria-hidden="true">·</span> {item.colour}</p>
                <button className="line-link gallery-open w-fit text-sm" type="button" aria-label={"Open " + item.name} aria-haspopup="dialog" onClick={(event) => {
                  openingButton.current = event.currentTarget
                  setSelected(item.slug)
                }}>Open this stone <ArrowUpRight size={17} aria-hidden="true" /></button>
              </div>
            </motion.li>)}
          </AnimatePresence>
        </ul>
        {visible.length > 1 && <div className="gallery-rail-controls">
          <button className="icon-button" type="button" aria-label="Scroll to previous gallery card" onClick={() => moveRail(-1)} disabled={railEdges.start}>
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
          <button className="icon-button" type="button" aria-label="Scroll to next gallery card" onClick={() => moveRail(1)} disabled={railEdges.end}>
            <ArrowRight size={20} aria-hidden="true" />
          </button>
        </div>}
        {!visible.length && <p role="status">There are no sample stones in this selection.</p>}
        <p className="text-sm text-cream/80">Sample stones shown until live stock is added.</p>
      </div>
      <Dialog open={!!stone} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        <DialogContent data-lenis-prevent className="overlay-scroll max-h-[90dvh] max-w-3xl! overflow-y-auto rounded-3xl p-6 sm:p-8"
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            if (!useUi.getState().overlay) openingButton.current?.focus()
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
              event.preventDefault()
              move(event.key === "ArrowLeft" ? -1 : 1)
            }
          }}>
          {stone && <>
            <div className="grid gap-6 pt-4 md:grid-cols-2 md:items-center">
              <div className="stone-art rounded-2xl"><GemArt cut={stone.cut} tint={stone.tint} label={"Illustration of " + stone.name} sizes="(min-width: 768px) 350px, 80vw" /></div>
              <div className="grid gap-3" aria-live="polite">
                <p className="eyebrow text-[#785520]">{gemNames[stone.gem_type]} / Sample stone</p>
                <DialogTitle className="font-display text-4xl">{stone.name}</DialogTitle>
                <DialogDescription>{stone.description}</DialogDescription>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div><dt className="text-muted-foreground">Cut</dt><dd>{stone.cut}</dd></div>
                  <div><dt className="text-muted-foreground">Weight</dt><dd>{stone.carat} ct</dd></div>
                  <div><dt className="text-muted-foreground">Colour</dt><dd>{stone.colour}</dd></div>
                  <div><dt className="text-muted-foreground">Sample price</dt><dd>{formatPrice(stone.price_lkr, currency)}</dd></div>
                </dl>
                <div className="flex flex-wrap gap-2">
                  <Link href={"/shop/" + stone.slug} onClick={() => setSelected(null)} className="pill pill-primary">View details</Link>
                  <button className="pill" type="button" onClick={() => {
                    setSelected(null)
                    openEnquiry([stone])
                    useUi.setState({ returnFocus: openingButton.current })
                  }}>Enquire</button>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 border-t pt-4">
              <button className="icon-button" aria-label="Previous stone" type="button" disabled={visible.length < 2} onClick={() => move(-1)}><ArrowLeft size={20} aria-hidden="true" /></button>
              <p className="text-sm tabular-nums">{selection + 1} / {visible.length}</p>
              <button className="icon-button" aria-label="Next stone" type="button" disabled={visible.length < 2} onClick={() => move(1)}><ArrowRight size={20} aria-hidden="true" /></button>
            </div>
          </>}
        </DialogContent>
      </Dialog>
    </section>
  )
}
