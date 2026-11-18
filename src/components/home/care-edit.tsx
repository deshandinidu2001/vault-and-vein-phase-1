import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { photos } from "@/config/images"
import { ResponsivePhoto } from "@/components/ui/responsive-photo"
import { SectionHeading } from "@/components/ui/section-heading"

export function CareEdit() {
  return <section id="care" className="wrap section film-grid">
    <div className="photo aspect-[4/3]" data-image-reveal><ResponsivePhoto photo={photos.care} sizes="(min-width: 768px) 50vw, 95vw" /></div>
    <div className="grid gap-5">
      <SectionHeading eyebrow="After the sale">Keep its colour close.</SectionHeading>
      <p data-reveal>Store a gemstone separately, check its setting from time to time and choose a cleaning method suited to the gem and any treatment. A little care makes a difference over years of wear.</p>
      <Link href="/about#care" className="line-link w-fit" data-reveal>Read the care guide <ArrowRight size={19} aria-hidden="true" /></Link>
    </div>
  </section>
}
