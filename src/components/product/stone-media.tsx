"use client"

import { useState } from "react"
import { productPhotoUrl } from "@/lib/product-photo"
import type { Stone } from "@/types/stone"

export function StoneMedia({ stone, label, sizes, width = 900, contain = false, eager = false }: {
  stone: Pick<Stone, "image_url">
  label: string
  sizes: string
  width?: number
  contain?: boolean
  eager?: boolean
}) {
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null)
  const photo = productPhotoUrl(stone.image_url, width)
  if (!photo || photo === failedPhoto) {
    return label ? <span className="photo-unavailable">Photo unavailable</span> : null
  }
  const widths = [64, 96, 128, 240, 384, 480, 640, 768, 960, 1200].filter(candidate => candidate < width)
  const srcSet = [...widths, width].map(candidate => productPhotoUrl(stone.image_url, candidate) + " " + candidate + "w").join(", ")
  // Cloudinary handles resizing and format negotiation directly for each candidate.
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt={label} sizes={sizes} srcSet={srcSet} src={photo} decoding="async"
    loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : "auto"}
    className={"absolute inset-0 size-full " + (contain ? "object-contain" : "object-cover")}
    onError={() => setFailedPhoto(photo)} />
}
