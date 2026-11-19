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
  return <Reveal className="home-content">
    <section className="home-masthead" aria-labelledby="about-title">
      <div className="hero-panel">
        <div className="hero-media"><div className="hero-art"><div className="hero-frame" data-supplied-photo="true">
          <ResponsivePhoto photo={photos.aboutHeritage} sizes="100vw" priority />
        </div></div></div>
        <div className="hero-intro">
          <p className="eyebrow">Our story</p>
          <h1 id="about-title">Formed by colour.</h1>
          <div className="hero-actions-copy">
            <p>Vault &amp; Vein takes its cue from Sri Lanka’s gemstone heritage. We built the collection around the pleasure of looking closely at a stone’s colour, cut and character.</p>
            <div className="hero-actions"><Link className="pill hero-primary" href="/shop">Explore the collection</Link></div>
          </div>
        </div>
      </div>
    </section>
    <section className="wrap section grid gap-8">
      <SectionHeading eyebrow="From rough to polish">The work in every facet.</SectionHeading>
      <dl className="grid gap-6 md:grid-cols-3">
        {process.map(([title, text]) => <div className="grid content-start gap-3 border-t border-emerald/20 pt-5" key={title} data-reveal><dt className="font-display text-3xl font-semibold">{title}</dt><dd className="text-muted-foreground">{text}</dd></div>)}
      </dl>
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
    <section className="wrap section border-t border-emerald/15">
      <div className="grid justify-items-start gap-6 rounded-3xl border border-emerald/15 bg-[#ede4d1] p-7 text-deep sm:p-10 lg:p-16">
        <h2 data-split>{site.closing}</h2>
        <Link className="pill pill-primary" href="/shop">Explore the Collection</Link>
      </div>
    </section>
  </Reveal>
}
