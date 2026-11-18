import Link from "next/link"
import { notFound } from "next/navigation"
import { z } from "zod"
import { requireAdminDatabase } from "@/lib/admin-auth"
import { collections, gemCuts, gemTypes, productFlags, type ProductInput } from "@/lib/admin-product"
import { gemNames } from "@/types/stone"
import { saveProduct } from "../../actions"

const textFields = [
  ["name", "Name"], ["slug", "URL slug"], ["colour", "Colour"], ["clarity", "Clarity"],
  ["treatment", "Treatment"], ["origin", "Origin"],
] as const
const numberFields = [
  ["carat", "Weight (ct)"], ["length_mm", "Length (mm)"], ["width_mm", "Width (mm)"],
  ["depth_mm", "Depth (mm)"], ["price_lkr", "Price (LKR)"],
] as const
const inputStyle = "min-h-11 w-full rounded-lg border border-input bg-background px-3"
const messages = {
  invalid: "Check the listing fields and use at most two decimal places for measurements.",
  duplicate: "This URL slug already exists.",
  unavailable: "The stone could not be saved. Check whether its stock status has changed.",
}

export default async function EditProduct({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  const db = await requireAdminDatabase()
  const { id } = await params
  const { result } = await searchParams
  let product: (ProductInput & { status: string }) | undefined
  if (id !== "new") {
    if (!z.uuid().safeParse(id).success) notFound()
    const { error } = await db.rpc("expire_checkouts")
    if (error) throw new Error("Could not refresh reservations")
    const query = await db.from("products").select("*").eq("id", id).maybeSingle()
    if (query.error) throw new Error("Could not load the listing")
    if (!query.data) notFound()
    product = query.data
  }
  const message = typeof result === "string" && Object.hasOwn(messages, result) ? messages[result as keyof typeof messages] : null
  return <section className="max-w-3xl space-y-6">
    <Link href="/admin" className="line-link">Back to inventory</Link>
    <h1>{product ? "Edit listing" : "New listing"}</h1>
    {message && <p role="alert">{message}</p>}
    {product && product.status !== "available" ? <p>{product.name} is {product.status}. Listing details are locked while the stone is held or sold.</p> :
      <form action={saveProduct.bind(null, product ? id : null)} className="grid gap-5 rounded-2xl border border-emerald/15 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {textFields.map(([name, label]) => <label key={name} className="grid gap-2">{label}
            <input name={name} className={inputStyle} required maxLength={name === "slug" ? 80 : 120}
              pattern={name === "slug" ? "[a-z0-9]+(?:\\x2d[a-z0-9]+)*" : undefined} defaultValue={product?.[name]} />
          </label>)}
          <label className="grid gap-2">Gem type
            <select name="gem_type" className={inputStyle} defaultValue={product?.gem_type}>
              {gemTypes.map((type) => <option key={type} value={type}>{gemNames[type]}</option>)}
            </select>
          </label>
          <label className="grid gap-2">Cut
            <select name="cut" className={inputStyle} defaultValue={product?.cut}>
              {gemCuts.map((cut) => <option key={cut}>{cut}</option>)}
            </select>
          </label>
          {numberFields.map(([name, label]) => {
            const price = name === "price_lkr"
            return <label key={name} className="grid gap-2">{label}
              <input type="number" name={name} className={inputStyle} min={price ? 1 : .01} max={price ? 100000000 : 999999.99}
                step={price ? 1 : .01} defaultValue={product?.[name]} required />
            </label>
          })}
          <label className="grid gap-2">Illustration tint
            <input name="tint" className={inputStyle + " p-2"} type="color" defaultValue={product?.tint ?? "#28654f"} />
          </label>
        </div>
        <label className="grid gap-2">Description
          <textarea className={inputStyle + " py-2"} rows={4} name="description" maxLength={3000} defaultValue={product?.description} required />
        </label>
        <fieldset>
          <legend className="font-semibold">Collections</legend>
          <div className="mt-2 flex flex-wrap gap-x-4">
            {collections.map((name) => <label key={name} className="flex min-h-11 items-center gap-2 capitalize">
              <input type="checkbox" name="collections" value={name} defaultChecked={product?.collections.includes(name)} />{name}
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
        <button className="pill pill-primary w-fit" type="submit">Save listing</button>
      </form>}
  </section>
}
