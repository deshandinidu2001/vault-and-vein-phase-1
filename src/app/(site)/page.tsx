import { Reveal } from "@/components/animation/reveal"
import { CollectionEdit } from "@/components/home/collection-edit"
import { EngagementEdit } from "@/components/home/engagement-edit"
import { Experience } from "@/components/home/experience"
import { HeroSlider } from "@/components/home/hero-slider"

export default function Home() {
  return (
    <>
      <HeroSlider />
      <Reveal>
        <CollectionEdit />
        <Experience />
        <EngagementEdit />
      </Reveal>
    </>
  )
}
