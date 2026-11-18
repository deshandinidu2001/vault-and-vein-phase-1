import { getImageProps } from "next/image"
import type { PhotoSlot } from "@/config/images"

export function ResponsivePhoto({
  photo, sizes, priority = false, zoom = photo.zoom,
}: {
  photo: PhotoSlot
  sizes: string
  priority?: boolean
  zoom?: number
}) {
  const shared = {
    alt: photo.alt, sizes, fill: true, fetchPriority: priority ? "high" as const : "auto" as const,
    loading: priority ? "eager" as const : "lazy" as const,
    style: { objectFit: "cover" as const, objectPosition: photo.origin, transformOrigin: photo.origin, scale: zoom },
  }
  const { props: mobile } = getImageProps({ ...shared, src: photo.srcMobile })
  const { props: desktop } = getImageProps({ ...shared, src: photo.src })
  return (
    <picture>
      <source media="(max-width: 639px)" srcSet={mobile.srcSet} sizes={sizes} />
      {/* getImageProps provides Next's optimized sources to the art-directed picture. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img {...desktop} />
    </picture>
  )
}
