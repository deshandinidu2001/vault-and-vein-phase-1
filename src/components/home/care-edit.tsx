import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { photos } from "@/config/images"
import { ResponsivePhoto } from "@/components/ui/responsive-photo"
import { SectionHeading } from "@/components/ui/section-heading"

export function CareEdit() {
  return (
    <section id="care" className="wrap section" aria-label="After the sale">
      <div className="editorial-card care-banner">
        <div className="care-backdrop">
          <ResponsivePhoto photo={photos.care} sizes="(min-width: 1600px) 1520px, 94vw" />
        </div>
        <div className="care-banner-copy">
          <SectionHeading eyebrow="After the sale">Keep its colour close.</SectionHeading>
          <p>A soft cloth and a separate pouch are a good start. Choose a cleaning method that suits your gemstone, its treatment and its setting.</p>
          <ul className="care-tips">
            <li>Wipe gently with a soft, lint-free cloth.</li>
            <li>Store the stone apart from other jewellery.</li>
            <li>Check with a jeweller before using steam or ultrasonic cleaners.</li>
          </ul>
          <Link href="/about#care" className="pill pill-primary w-fit">Read the care guide <ArrowRight size={18} aria-hidden="true" /></Link>
        </div>
      </div>
    </section>
  )
}
