"use client"

import { useState } from "react"
import { StoneMedia } from "./stone-media"
import type { Stone } from "@/types/stone"

export function ProductGallery({ stone, extraPhotos }: { stone: Stone; extraPhotos: string[] }) {
  const photos = [stone.image_url, ...extraPhotos].filter((photo): photo is string => Boolean(photo))
  const [selected, setSelected] = useState<string>()
  const photo = selected && photos.includes(selected) ? selected : photos[0]
  const index = photo ? photos.indexOf(photo) : -1
  const label = index === 0 ? "Photo of " + stone.name
    : index > 0 ? "Photo " + (index + 1) + " of " + stone.name : "Illustration of " + stone.name

  return <figure className="grid min-w-0 gap-4">
    <div className="stone-art product-feature-image">
      <StoneMedia stone={{ ...stone, image_url: photo }} label={label} sizes="(min-width: 1400px) 665px, (min-width: 768px) 52vw, 95vw" width={1500} eager />
    </div>
    {photos.length > 1 && <figcaption className="grid gap-2">
      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>Product photos</span>
        <span aria-live="polite" aria-atomic="true">Photo {index + 1} of {photos.length}</span>
      </div>
      <ul className="product-photo-strip" aria-label="Product photos">
        {photos.map((url, i) => <li key={url}>
          <button type="button" className="product-photo-thumbnail" aria-pressed={url === photo}
            aria-label={i === 0 ? "Show cover photo" : "Show photo " + (i + 1)} onClick={() => setSelected(url)}>
            <StoneMedia stone={{ ...stone, image_url: url }} label="" sizes="80px" width={240} />
          </button>
        </li>)}
      </ul>
    </figcaption>}
    {!photo && <figcaption className="text-sm text-muted-foreground">Gemstone illustration</figcaption>}
  </figure>
}
