import Image from "next/image"
import { gemSvg, type GemCut, type GemStage } from "./gem-shape"

export function GemArt({ cut, tint, label, sizes = "100vw", stage = 2, profile = false, className = "" }: {
  cut: GemCut
  tint: string
  label: string
  sizes?: string
  stage?: GemStage
  profile?: boolean
  className?: string
}) {
  const image = "data:image/svg+xml," + encodeURIComponent(gemSvg(cut, tint, stage, profile))
  return <Image src={image} alt={label} fill unoptimized sizes={sizes} className={"object-contain " + className} />
}
