import { StoneMedia } from "@/components/product/stone-media"
import { maxProductPhotos } from "@/lib/product-photo"
import { editProductGallery } from "../../actions"
import { PhotoPicker } from "./photo-picker"

export function GalleryEditor({ id, revision, stone, uploads }: {
  id: string
  revision: string
  stone: { image_url?: string | null; gallery_urls?: string[] }
  uploads: boolean
}) {
  const photos = [stone.image_url, ...(stone.gallery_urls ?? [])].filter((photo): photo is string => Boolean(photo))
  const slots = maxProductPhotos - photos.length
  return <section id="product-photos" className="admin-panel grid scroll-mt-24 gap-5 p-5 sm:p-7" aria-labelledby="photos-heading">
    <div>
      <h2 id="photos-heading" className="text-3xl">Product photos</h2>
      <p className="mt-1 admin-muted">The cover photo appears first in the gallery, in the shop and in the cart.</p>
    </div>
    {photos.length > 0 && <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {photos.map((photo, index) => <li key={photo} className="admin-panel overflow-hidden">
        <div className="relative aspect-[4/3] bg-muted">
          <StoneMedia stone={{ ...stone, image_url: photo }} label={index === 0 ? "Cover photo" : "Product photo " + (index + 1)}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" width={500} />
        </div>
        <div className="flex flex-wrap items-center gap-2 p-3">
          {index === 0 ? <span className="me-auto text-sm font-semibold">Cover photo</span> :
            <form action={editProductGallery.bind(null, id, revision, "cover", photo)}>
              <button type="submit" className="admin-button" aria-label={"Set photo " + (index + 1) + " as cover"}>Set as cover</button>
            </form>}
          <form action={editProductGallery.bind(null, id, revision, "remove", photo)}>
            <button type="submit" className="admin-button admin-button-danger" aria-label={index === 0 ? "Remove cover photo" : "Remove photo " + (index + 1)}>Remove</button>
          </form>
        </div>
      </li>)}
    </ul>}
    {slots <= 0 ? <p className="admin-muted">All eight photo slots are in use.</p> : uploads ? (
      <form action={editProductGallery.bind(null, id, revision, "add", null)} className="grid justify-items-start gap-3">
        <PhotoPicker key={revision} slots={slots} hasCover={photos.length > 0} required />
        <button type="submit" className="admin-button admin-button-primary">Upload photos</button>
      </form>
    ) : <p className="admin-muted">Configure Cloudinary to upload photos.</p>}
  </section>
}
