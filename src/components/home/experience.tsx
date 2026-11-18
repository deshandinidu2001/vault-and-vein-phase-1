import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

const steps = [
  {
    title: "First, we source.",
    body: "We look for character in the rough: colour, clarity and the parts a cutter can bring into view.",
    drawing: (
      <>
        <path className="craft-guide" d="M17 88h146M90 11v81" />
        <path d="m37 63 14-32 30-14 39 13 23 29-25 25-47 8Z" />
        <path d="m37 63 39-8 13-23 31-2M51 31l25 24-5 37m5-37 30 12 12 17m-29-52 17 35 37-8" />
        <path className="craft-accent" d="m41 70 29-9 19 9 21-19 26 9m-76-34 22 9 17-13" />
      </>
    ),
  },
  {
    title: "Then, we cut.",
    body: "We consider proportion and facet placement so the cut can make the most of a stone’s colour and light.",
    drawing: (
      <>
        <path className="craft-guide" d="M24 50h132M90 8v84M39 19h102M39 81h102" />
        <path d="m53 24 37-8 37 8 15 26-15 26-37 8-37-8-15-26Z" />
        <path d="m67 35 23-5 23 5 10 15-10 15-23 5-23-5-10-15Z" />
        <path d="m53 24 14 11m23-19v14m37-6-14 11m29 15h-19m4 26-14-11M90 84V70m-37 6 14-11M38 50h19" />
        <path className="craft-accent" d="m67 35 23-5 23 5 10 15-10 15-23 5-23-5-10-15Z" />
      </>
    ),
  },
  {
    title: "Finally, we certify.",
    body: "When a lab report is available, we share it so you can review the findings for that individual stone.",
    drawing: (
      <>
        <path className="craft-guide" d="M25 89h130M37 17h106" />
        <path d="M53 13h57l18 18v58H53Zm57 0v18h18M65 29h27M65 41h46M65 51h33M65 62h21M65 73h16" />
        <circle className="craft-accent" cx="107" cy="65" r="11" />
        <path className="craft-accent" d="m102 65 3 3 6-7m-9 15-3 7 8-3 8 3-3-7" />
      </>
    ),
  },
]

export function Experience() {
  return (
    <section id="experience" className="wrap section" aria-labelledby="craft-title">
      <div className="craft-panel dark-panel">
        <div className="craft-intro">
          <div>
            <p className="eyebrow">The Vault &amp; Vein way</p>
            <h2 id="craft-title">What a stone can become.</h2>
          </div>
          <p>Colour starts in the rough. The decisions that follow bring it into focus and help you understand the finished stone.</p>
        </div>
        <ol className="craft-steps" role="list">
          {steps.map(({ title, body, drawing }, index) => (
            <li className="craft-step" key={title}>
              <div className="craft-step-visual" aria-hidden="true">
                <span>0{index + 1}</span>
                <svg viewBox="0 0 180 100" fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round">
                  {drawing}
                </svg>
              </div>
              <h3>{title}</h3>
              <p>{body}</p>
            </li>
          ))}
        </ol>
        <Link href="/about" className="line-link craft-link">
          Read our story <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}
