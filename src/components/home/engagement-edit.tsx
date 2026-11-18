import Link from "next/link"
import { photos } from "@/config/images"
import { ResponsivePhoto } from "@/components/ui/responsive-photo"
import { SectionHeading } from "@/components/ui/section-heading"

export function EngagementEdit() {
  return (
    <section id="engagement" className="wrap section">
      <div className="film-grid editorial-card editorial-card-engagement">
        <div className="editorial-copy grid gap-6">
          <SectionHeading eyebrow="The engagement edit">For the stone<br />you’ll<br />treasure.</SectionHeading>
          <p data-reveal>A stone for an engagement ring starts with something personal. We can help turn that first idea into a short list that suits the ring you want to make.</p>
          <ul className="list-disc space-y-2 pl-5 marker:text-[#8a6627]" data-reveal>
            <li>Guidance on colour and cut</li>
            <li>Help matching a stone to its setting</li>
            <li>Certificate review where available</li>
          </ul>
          <div className="grid justify-items-start gap-3" data-reveal>
            <Link href="/shop?collection=engagement" className="pill pill-primary">View engagement stones</Link>
            <p className="text-sm text-muted-foreground">Tell us your budget and preferred colour.</p>
          </div>
        </div>
        <div className="photo editorial-media" data-image-reveal data-parallax>
          <ResponsivePhoto photo={photos.engagement} sizes="(min-width: 768px) 50vw, 95vw" />
        </div>
      </div>
    </section>
  )
}
