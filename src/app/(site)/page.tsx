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
import Link from "next/link"

import { getFeatured } from "@/lib/data"
import { getGemCategories } from "@/lib/gem-categories"
import { CatalogueUnavailableError } from "@/lib/backend"
import { pageMetadata } from "@/lib/seo"
import { site } from "@/config/site"

export const metadata = pageMetadata(site.tagline, site.description, "/")

async function FeaturedGallery() {
  const result = await Promise.all([getFeatured(), getGemCategories()]).catch(error => {
    if (!(error instanceof CatalogueUnavailableError)) throw error
    console.warn("The featured gemstone gallery is temporarily unavailable.")
    return null
  })
  if (!result) return <section id="gallery" className="section dark-panel"><div className="wrap space-y-4">
      <h2>The gem gallery</h2><p>We couldn’t load the featured stones.</p>
      <Link href="/shop" className="pill pill-gold">Explore the shop</Link>
    </div></section>
  const [stones, { categories }] = result
  if (stones.length === 0) return <section id="gallery" className="section dark-panel">
    <div className="wrap space-y-4">
      <h2>The gem gallery</h2>
      <p>New listings will appear here. Contact us if you’re looking for a particular stone.</p>
      <Link href="/contact" className="pill pill-gold">Contact us</Link>
    </div>
  </section>
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
