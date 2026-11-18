import { Reveal } from "@/components/animation/reveal"
import { CareEdit } from "@/components/home/care-edit"
import { CollectionEdit } from "@/components/home/collection-edit"
import { EngagementEdit } from "@/components/home/engagement-edit"
import { Experience } from "@/components/home/experience"
import { Faq } from "@/components/home/faq"
import { FinalCall } from "@/components/home/final-call"
import { GemGallery } from "@/components/home/gem-gallery"
import { HeroSlider } from "@/components/home/hero-slider"

import { getFeatured } from "@/lib/data"
import { pageMetadata } from "@/lib/seo"
import { site } from "@/config/site"

export const metadata = pageMetadata(site.tagline, site.description, "/")

export default async function Home() {
  const stones = await getFeatured()
  return (
    <>
      <HeroSlider />
      <Reveal className="home-content">
        <CollectionEdit />
        <Experience />
        <EngagementEdit />
        <GemGallery stones={stones} />
        <CareEdit />
        <Faq />
        <FinalCall />
      </Reveal>
    </>
  )
}
