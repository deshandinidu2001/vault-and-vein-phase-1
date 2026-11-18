import type { ReactNode } from "react"

export function SectionHeading({ eyebrow, children }: { eyebrow: string; children: ReactNode }) {
  return <div className="section-heading"><p className="eyebrow" data-reveal>{eyebrow}</p><h2 data-split>{children}</h2></div>
}
