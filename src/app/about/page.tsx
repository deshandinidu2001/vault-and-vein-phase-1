import Link from "next/link"
import { Reveal } from "@/components/animation/reveal"
import { ResponsivePhoto } from "@/components/ui/responsive-photo"
import { SectionHeading } from "@/components/ui/section-heading"
import { photos } from "@/config/images"
import { site } from "@/config/site"
import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata("About", "The ideas, craft and Sri Lankan gemstone heritage behind Vault & Vein.", "/about")

const process = [
  ["Sourcing", "We start by considering the colour and character of the rough, what is known about its origin and what should be disclosed about it."],
  ["Cutting and polishing", "A cutter must balance colour, spread, symmetry and how much rough can be kept. Polishing brings the finished facets into focus."],
  ["Certification", "When a report is available, it belongs with the individual stone. Ask to review the actual report and what its findings cover."],
]

const care = [
  ["Clean gently", "Use a soft cloth as a first step. Ask a jeweller before soaking a stone or using steam, ultrasonic cleaners or chemicals, especially when treatment is unknown."],
  ["Store separately", "A lined compartment or individual pouch keeps stones and metal fittings from rubbing against one another."],
  ["Wear thoughtfully", "Remove jewellery for impact-heavy work and have a jeweller check loose settings. Care needs can vary by gem, treatment and setting."],
]

export default function About() {
  return <Reveal>
    <section className="wrap section page-top film-grid">
      <div className="grid gap-6">
        <p className="eyebrow text-[#785520]" data-reveal>Our story</p>
        <h1 data-split>Formed by colour.</h1>
        <p data-reveal>Vault &amp; Vein takes its cue from Sri Lanka’s gemstone heritage. A stone’s colour, shape and small irregularities can tell you as much as its name. We built the collection around the pleasure of looking closely.</p>
      </div>
      <div className="photo aspect-[4/5] md:aspect-square" data-image-reveal>
        <ResponsivePhoto photo={photos.aboutHeritage} sizes="(min-width: 768px) 50vw, 95vw" priority />
      </div>
    </section>
    <section className="section marble dark-panel">
      <div className="wrap film-grid">
        <div className="photo aspect-[4/3]" data-image-reveal><ResponsivePhoto photo={photos.aboutCraft} sizes="(min-width: 768px) 50vw, 95vw" /></div>
        <div className="grid gap-6">
          <SectionHeading eyebrow="From rough to polish">The work in every facet.</SectionHeading>
          <dl className="divide-y divide-cream/20">
            {process.map(([title, text]) => <div className="grid gap-2 py-4" key={title} data-reveal><dt className="font-semibold">{title}</dt><dd className="text-cream/85">{text}</dd></div>)}
          </dl>
        </div>
      </div>
    </section>
    <section className="wrap section grid gap-6 border-b border-emerald/15">
      <SectionHeading eyebrow="What we value">Clear information. Room for curiosity.</SectionHeading>
      <p data-reveal>Compare measurements, ask about treatment and take your time with a stone’s colour. We want collectors and designers to have enough information to decide whether a stone belongs in their collection or setting.</p>
    </section>
    <section id="care" className="wrap section grid gap-8">
      <SectionHeading eyebrow="Care guide">Live with the stones you love.</SectionHeading>
      <ul className="grid gap-6 md:grid-cols-3">
        {care.map(([title, text]) => <li className="grid content-start gap-3 border-t border-emerald/20 pt-5" key={title} data-reveal><h3>{title}</h3><p>{text}</p></li>)}
      </ul>
    </section>
    <section className="section dark-panel">
      <div className="wrap grid justify-items-start gap-6"><h2 data-split>{site.closing}</h2><Link className="pill pill-gold" href="/shop">Explore the Collection</Link></div>
    </section>
  </Reveal>
}
