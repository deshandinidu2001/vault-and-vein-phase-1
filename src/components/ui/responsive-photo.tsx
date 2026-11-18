import { getImageProps } from "next/image"
import type { CSSProperties } from "react"
import type { PhotoSlot } from "@/config/images"

export function ResponsivePhoto({
  photo, sizes, priority = false, zoom = photo.zoom,
}: {
  photo: PhotoSlot
  sizes: string
  priority?: boolean
  zoom?: number
}) {
  const position = "var(--photo-crop, " + photo.origin + ")"
  const shared = {
    alt: photo.alt, sizes, fill: true, fetchPriority: priority ? "high" as const : "auto" as const,
    loading: priority ? "eager" as const : "lazy" as const,
    style: {
      objectFit: "cover",
      objectPosition: position,
      transformOrigin: position,
      scale: zoom,
      "--photo-mobile-crop": photo.mobileOrigin,
    } as CSSProperties,
  }
  const { props: mobile } = getImageProps({ ...shared, src: photo.srcMobile })
  const { props: desktop } = getImageProps({ ...shared, src: photo.src })
  return (
    <picture>
      <source media="(max-width: 639px)" srcSet={mobile.srcSet} sizes={sizes} />
      {/* getImageProps provides Next's optimized sources to the art-directed picture. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img {...desktop} className={photo.mobileOrigin ? "photo-with-mobile-crop" : undefined} />
    </picture>
  )
}
