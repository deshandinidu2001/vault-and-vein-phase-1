import Link from "next/link"
import { notFound } from "next/navigation"
import { z } from "zod"
import { requireAdminDatabase } from "@/lib/admin-auth"
import { expireCheckouts } from "@/lib/checkout"
import { productFlags, type ProductInput } from "@/lib/admin-product"
import { readGemCategories } from "@/lib/gem-categories"
import { cloudinaryConfigured } from "@/lib/cloudinary"
import { readShopFilterSettings } from "@/lib/shop-filter-settings"
import { normalizeShopOption, shopFilterConfig } from "@/lib/shop-filter-config"
import { saveProduct } from "../../actions"
import { GalleryEditor } from "./gallery-editor"

const textFields = [
  ["name", "Name"], ["slug", "URL slug"], ["colour", "Colour"], ["clarity", "Clarity"],
  ["treatment", "Treatment"], ["origin", "Origin"],
] as const
const numberFields = [
  ["carat", "Weight (ct)"], ["length_mm", "Length (mm)"], ["width_mm", "Width (mm)"],
  ["depth_mm", "Depth (mm)"], ["price_lkr", "Price (LKR)"],
] as const
const inputStyle = "admin-field"
const messages = {
  invalid: "Check the listing fields and use at most two decimal places for measurements.",
  duplicate: "This URL slug already exists.",
  unavailable: "The stone could not be saved. Check whether its stock status has changed.",
  "photo-config": "Configure Cloudinary before uploading photos.",
  "photo-choice": "Use the product photos section to change existing images.",
  "photo-invalid": "Choose a JPEG, PNG or WebP image under 3 MB.",
  "photo-failed": "Cloudinary could not save this image. Try uploading it again.",
  "photo-saved": "Product photos updated.",
  "photo-capacity": "Remove a photo before adding another. Each listing holds up to eight photos.",
  "photo-stale": "This listing changed. Check the current photos and try again.",
}

export default async function EditProduct({ params, searchParams }: PageProps<"/vault8@vein@8/products/[id]">) {
  const db = await requireAdminDatabase()
  const { id } = await params
  const { result } = await searchParams
  const [categories, settings] = await Promise.all([readGemCategories(db), readShopFilterSettings(db)])
  const photosEnabled = cloudinaryConfigured()
  let product: (ProductInput & { status: string; image_url: string | null; gallery_urls: string[]; gallery_revision: string }) | undefined
  if (id !== "new") {
    if (!z.uuid().safeParse(id).success) notFound()
    await expireCheckouts(db)
    const listing = await db.product.findUnique({ where: { id, archived_at: null, is_sample: false } })
    if (!listing) notFound()
    product = {
      ...listing, carat: listing.carat.toNumber(), length_mm: listing.length_mm.toNumber(),
      width_mm: listing.width_mm.toNumber(), depth_mm: listing.depth_mm.toNumber(),
    }
  }
  const choices = shopFilterConfig(settings.rows, [], product ? [product] : []).options
  const revision = product?.gallery_revision
  const message = typeof result === "string" && Object.hasOwn(messages, result) ? messages[result as keyof typeof messages] : null
  return <section className="space-y-6">
    <Link href="/vault8@vein@8" className="admin-text-link">Back to inventory</Link>
    <h1>{product ? "Edit listing" : "New listing"}</h1>
    {message && <p className="admin-notice" role={result === "photo-saved" ? "status" : "alert"}>{message}</p>}
    {product?.status === "available" && revision && <GalleryEditor id={id} revision={revision} stone={product} uploads={photosEnabled} />}
    {product && product.status !== "available" ? <p>{product.name} is {product.status}. Listing details are locked while the stone is held or sold.</p> :
      <form action={saveProduct.bind(null, product ? id : null)} className="admin-panel grid gap-5 p-5 sm:p-7">
        {!product && <fieldset className="admin-photo-field">
          <legend className="font-semibold">Product photo</legend>
          {photosEnabled ? <div className="grid content-start gap-2">
            <label className="grid gap-1">Upload photo
              <input className={inputStyle} type="file" name="photo" accept="image/jpeg,image/png,image/webp" aria-describedby="photo-limits" />
            </label>
            <p id="photo-limits" className="admin-muted text-sm">JPEG, PNG or WebP, up to 3 MB.</p>
          </div> : <p className="admin-muted text-sm">Configure Cloudinary to upload product photos.</p>}
        </fieldset>}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {textFields.map(([name, label]) => <label key={name} className="grid gap-2">{label}
            <input name={name} className={inputStyle} required maxLength={name === "slug" ? 80 : 120}
              pattern={name === "slug" ? "[a-z0-9]+(?:\\x2d[a-z0-9]+)*" : undefined} defaultValue={product?.[name]}
              list={name === "colour" || name === "origin" ? "listing-" + name : undefined} />
            {(name === "colour" || name === "origin") && <datalist id={"listing-" + name}>
              {choices[name].map(({ value, label }) => <option key={value} value={label} />)}
            </datalist>}
          </label>)}
          <label className="grid gap-2">Gem type
            <select name="gem_type" className={inputStyle} defaultValue={product?.gem_type}>
              {categories.map(({ slug, name, is_visible }) => <option key={slug} value={slug}>{name}{is_visible ? "" : " (hidden)"}</option>)}
            </select>
          </label>
          <label className="grid gap-2">Cut
            <select name="cut" className={inputStyle} defaultValue={product?.cut}>
              {choices.cut.map(({ value, label }) => <option key={value}
                value={product && normalizeShopOption(product.cut) === value ? product.cut : label}>{label}</option>)}
            </select>
          </label>
          {numberFields.map(([name, label]) => {
            const price = name === "price_lkr"
            return <label key={name} className="grid gap-2">{label}
              <input type="number" name={name} className={inputStyle} min={price ? 1 : .01} max={price ? 100000000 : 999999.99}
                step={price ? 1 : .01} defaultValue={product?.[name]} required />
            </label>
          })}
        </div>
        <label className="grid gap-2">Description
          <textarea className={inputStyle + " py-2"} rows={4} name="description" maxLength={3000} defaultValue={product?.description} required />
        </label>
        <fieldset>
          <legend className="font-semibold">Collections</legend>
          <div className="mt-2 flex flex-wrap gap-x-4">
            {choices.collection.map(({ value, label }) => <label key={value} className="flex min-h-11 items-center gap-2">
              <input type="checkbox" name="collections" value={value} defaultChecked={product?.collections.includes(value)} />{label}
            </label>)}
          </div>
        </fieldset>
        <fieldset>
          <legend className="font-semibold">Listing settings</legend>
          <div className="mt-2 flex flex-wrap gap-x-4">
            {productFlags.map(({ name, label }) => <label key={name} className="flex min-h-11 items-center gap-2">
              <input type="checkbox" name={name} defaultChecked={product?.[name]} />{label}
            </label>)}
          </div>
        </fieldset>
        <button className="admin-button admin-button-primary w-fit" type="submit">Save listing</button>
      </form>}
  </section>
}
