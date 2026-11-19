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
import { getGemCategories } from "@/lib/gem-categories"
import { pageMetadata } from "@/lib/seo"
import { site } from "@/config/site"

export const metadata = pageMetadata(site.tagline, site.description, "/")

export default async function Home() {
  const [stones, { categories }] = await Promise.all([getFeatured(), getGemCategories()])
  return (
    <>
      <HeroSlider />
      <Reveal className="home-content">
        <CollectionEdit />
        <Experience />
        <EngagementEdit />
        <GemGallery stones={stones} categoryLabels={Object.fromEntries(categories.map(({ slug, name }) => [slug, name]))} />
        <CareEdit />
        <Faq />
        <FinalCall />
      </Reveal>
    </>
  )
}
