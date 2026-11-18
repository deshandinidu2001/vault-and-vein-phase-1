import { Reveal } from "@/components/animation/reveal"
import { CareEdit } from "@/components/home/care-edit"
import { CollectionEdit } from "@/components/home/collection-edit"
import { EngagementEdit } from "@/components/home/engagement-edit"
import { Experience } from "@/components/home/experience"
import { Faq } from "@/components/home/faq"
import { FinalCall } from "@/components/home/final-call"
import { GemGallery } from "@/components/home/gem-gallery"
import { HeroSlider } from "@/components/home/hero-slider"

export default function Home() {
  return (
    <>
      <HeroSlider />
      <Reveal>
        <CollectionEdit />
        <Experience />
        <EngagementEdit />
        <GemGallery stones={[]} />
        <CareEdit />
        <Faq />
        <FinalCall />
      </Reveal>
    </>
  )
}
