"use client"

import Image from "next/image"
import { useState } from "react"
import { GemArt } from "@/components/three/gem-art"
import { gemModelCut } from "@/components/three/gem-shape"
import { productPhotoUrl } from "@/lib/product-photo"
import type { Stone } from "@/types/stone"

export function StoneMedia({ stone, label, sizes, width = 900, contain = false, eager = false }: {
  stone: Pick<Stone, "cut" | "tint" | "image_url">
  label: string
  sizes: string
  width?: number
  contain?: boolean
  eager?: boolean
}) {
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null)
  const photo = productPhotoUrl(stone.image_url, width)
  return photo && photo !== failedPhoto
    ? <Image src={photo} alt={label} sizes={sizes} fill unoptimized loading={eager ? "eager" : "lazy"} className={contain ? "object-contain" : "object-cover"}
        onError={() => setFailedPhoto(photo)} />
    : <GemArt cut={gemModelCut(stone.cut)} tint={stone.tint} className="gem-illustration" label={label.replace(/^(?:Current photo|Photo) of /, "Illustration of ")} sizes={sizes} />
}
