import Link from "next/link"
import { ArrowUpRight, BadgeCheck, Gem, ScanLine } from "lucide-react"
import { editorialPhotos } from "@/config/images"
import { ResponsivePhoto } from "@/components/ui/responsive-photo"

const steps = [
  { title: "Read the rough", body: "We look for colour and clarity, then consider where a cutter could bring those qualities into view.", icon: Gem },
  { title: "Cut for the light", body: "Proportion and facet placement shape how light moves through a stone and how its colour appears face up.", icon: ScanLine },
  { title: "Share the findings", body: "When an independent lab report is available, we share it with the stone so you can review its findings.", icon: BadgeCheck },
]

export function Experience() {
  return (
    <section id="experience" className="wrap section craft-section" aria-labelledby="craft-title">
      <figure className="craft-figure">
        <div className="photo craft-photo" data-image-reveal>
          <ResponsivePhoto photo={editorialPhotos.bench} sizes="(min-width: 1024px) 48vw, 94vw" />
        </div>
      </figure>
      <div className="craft-copy">
        <p className="eyebrow">The Vault &amp; Vein way</p>
        <h2 id="craft-title" data-split>From rough stone to finished gem.</h2>
        <p>What we look for at every stage, from the first look at the rough to the details that accompany the finished stone.</p>
        <ol className="craft-steps" role="list">
          {steps.map(({ title, body, icon: Icon }) => (
            <li className="craft-step" key={title}>
              <span className="craft-icon"><Icon size={20} aria-hidden="true" /></span>
              <div><h3>{title}</h3><p>{body}</p></div>
            </li>
          ))}
        </ol>
        <Link href="/about" className="pill pill-primary craft-link">Read our story <ArrowUpRight size={17} aria-hidden="true" /></Link>
      </div>
    </section>
  )
}
