import { Reveal } from "@/components/animation/reveal"
import { CareEdit } from "@/components/home/care-edit"
import { CollectionEdit } from "@/components/home/collection-edit"
import { EngagementEdit } from "@/components/home/engagement-edit"
import { Experience } from "@/components/home/experience"
import { Faq } from "@/components/home/faq"
import { FinalCall } from "@/components/home/final-call"
import { GemGallery } from "@/components/home/gem-gallery"
import { HeroSlider } from "@/components/home/hero-slider"
import { Suspense } from "react"

import { getFeatured } from "@/lib/data"
import { getGemCategories } from "@/lib/gem-categories"
import { pageMetadata } from "@/lib/seo"
import { site } from "@/config/site"

export const metadata = pageMetadata(site.tagline, site.description, "/")

async function FeaturedGallery() {
  const [stones, { categories }] = await Promise.all([getFeatured(), getGemCategories()])
  return <GemGallery stones={stones} categoryLabels={Object.fromEntries(categories.map(({ slug, name }) => [slug, name]))} />
}

export default function Home() {
  return (
    <>
      <HeroSlider />
      <Reveal className="home-content">
        <CollectionEdit />
        <Experience />
        <EngagementEdit />
        <Suspense fallback={<div id="gallery" className="section dark-panel min-h-96" aria-busy="true" aria-label="Loading the gem gallery" />}><FeaturedGallery /></Suspense>
        <CareEdit />
        <Faq />
        <FinalCall />
      </Reveal>
    </>
  )
}
