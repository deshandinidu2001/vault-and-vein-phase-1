"use client"

import Image from "next/image"
import { useEffect, useId, useRef, useState, type ChangeEvent } from "react"
import { maxProductPhotoBytes, productPhotoTypes } from "@/lib/product-photo"

type Preview = { name: string; url: string }

export function PhotoPicker({ slots, required, hasCover = false }: {
  slots: number
  required?: boolean
  hasCover?: boolean
}) {
  const hintId = useId()
  const previewUrls = useRef<Preview[]>([])
  const [previews, setPreviews] = useState<Preview[]>([])
  const [error, setError] = useState("")

  useEffect(() => () => {
    previewUrls.current.forEach(({ url }) => URL.revokeObjectURL(url))
  }, [])

  function selectPhotos(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const files = Array.from(input.files ?? [])
    let message = ""
    if (files.length > slots) message = "Choose up to " + slots + (slots === 1 ? " photo." : " photos.")
    else if (files.some((file) => !file.size || !productPhotoTypes.includes(file.type))) {
      message = "Choose JPEG, PNG or WebP photos."
    } else if (files.reduce((total, file) => total + file.size, 0) > maxProductPhotoBytes) {
      message = "Choose photos with a combined size of up to 3 MB."
    }
    input.setCustomValidity(message)
    setError(message)
    previewUrls.current.forEach(({ url }) => URL.revokeObjectURL(url))
    previewUrls.current = message ? [] : files.map((file) => ({ name: file.name, url: URL.createObjectURL(file) }))
    setPreviews(previewUrls.current)
  }

  return <div className="grid min-w-0 gap-2">
    <label className="grid w-fit min-w-0 gap-1">
      Choose photos
      <input className="admin-field" type="file" name="photo" multiple accept={productPhotoTypes.join(",")}
        required={required} aria-describedby={hintId} aria-invalid={Boolean(error)} onChange={selectPhotos} />
    </label>
    <p id={hintId} className="admin-muted text-sm">
      {slots} {slots === 1 ? "slot" : "slots"} available. JPEG, PNG or WebP, up to 3 MB per batch.
      {!hasCover && " The first photo becomes the cover."}
    </p>
    {error && <p className="admin-notice" role="alert">{error}</p>}
    {previews.length > 0 && <ul aria-label="Selected photo previews" className="flex flex-wrap gap-3">
      {previews.map(({ url, name }, index) => <li key={url} className="admin-panel w-32 overflow-hidden sm:w-40">
        <div className="relative aspect-square bg-muted">
          <Image src={url} alt={"Preview of " + name} fill unoptimized className="object-cover" />
        </div>
        <p className="truncate px-2 pt-1.5 text-sm" title={name}>{name}</p>
        <p className="px-2 pb-1.5 text-xs admin-muted">{!hasCover && index === 0 ? "Cover photo" : "Gallery photo"}</p>
      </li>)}
    </ul>}
  </div>
}
