import Link from "next/link"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { ProductActions } from "@/components/product/product-actions"
import { ProductGallery } from "@/components/product/product-gallery"
import { StoneCard } from "@/components/shop/stone-card"
import { StonePrice } from "@/components/shop/stone-price"
import { Badge } from "@/components/ui/badge"
import { getRelated, getStoneBySlug, getStoneGallery } from "@/lib/data"
import { stoneCategory, type Stone } from "@/types/stone"
import { site } from "@/config/site"
import { checkoutConfig } from "@/lib/checkout"
import { pageMetadata, serializeJsonLd } from "@/lib/seo"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const stone = await getStoneBySlug(slug)
  if (!stone) return { title: "Stone not found", robots: { index: false, follow: true } }
  return pageMetadata(stone.name, stone.description, "/shop/" + stone.slug)
}

function ProductData({ stone }: { stone: Stone }) {
  const path = "/shop/" + stone.slug
  const product = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: stone.name,
    sku: stone.id,
    category: stoneCategory(stone),
    color: stone.colour,
    description: (stone.is_sample ? "Sample listing. " : "") + stone.description,
    url: new URL(path, site.url).href,
    image: new URL("/images/stones/" + stone.slug, site.url).href,
    brand: { "@type": "Brand", name: site.name },
    additionalProperty: [
      { "@type": "PropertyValue", name: "Cut", value: stone.cut },
      { "@type": "PropertyValue", name: "Carat", value: stone.carat },
      { "@type": "PropertyValue", name: stone.is_sample ? "Illustrative price (LKR)" : "Price (LKR)", value: stone.price_lkr },
    ],
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(product) }} />
}

async function RelatedStones({ stone }: { stone: Stone }) {
  const related = await getRelated(stone)
  if (!related.length) return null
  return <section className="grid gap-6 border-t border-emerald/15 pt-12">
    <h2>Related stones</h2>
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{related.map(item => <li key={item.id}><StoneCard stone={item} /></li>)}</ul>
  </section>
}

export default async function StoneDetail({ params }: Props) {
  const { slug } = await params
  const stone = await getStoneBySlug(slug)
  if (!stone) notFound()
  const photos = await getStoneGallery(stone.id)
  const details = [
    ["Gem type", stoneCategory(stone)], ["Cut", stone.cut], ["Weight", stone.carat + " ct"],
    ["Dimensions", [stone.length_mm, stone.width_mm, stone.depth_mm].join(" × ") + " mm"],
    ["Colour", stone.colour], ["Clarity", stone.clarity], ["Treatment", stone.treatment], ["Origin", stone.origin],
    ["Lab report", stone.certified ? (stone.is_sample ? "Indicated in sample record" : "Available on request") : "Not listed"],
  ]

  return <article className="wrap section page-top-compact space-y-8 md:space-y-12">
    <ProductData stone={stone} />
    <Link href="/shop" className="line-link text-sm"><ArrowLeft size={18} aria-hidden="true" /> Back to the shop</Link>
    <div className="grid gap-7 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:gap-10 xl:gap-16">
      <ProductGallery stone={stone} extraPhotos={photos} />
      <div className="grid min-w-0 content-start gap-6 md:pt-3">
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold text-[#785520]">{stoneCategory(stone)}{stone.is_sample && " / Sample stone"}</p>
            <Badge variant="outline" className="capitalize">{stone.status}</Badge>
          </div>
          <h1 className="wrap-anywhere text-[clamp(3rem,5.5vw,5.4rem)]">{stone.name}</h1>
          <p className="wrap-anywhere text-muted-foreground">{stone.cut} cut · {stone.carat} ct · {stone.colour}</p>
        </div>
        <div className="product-purchase grid gap-4">
          <span className="text-2xl font-semibold text-emerald"><StonePrice lkr={stone.price_lkr} both /></span>
          <p className="text-sm text-muted-foreground">{stone.is_sample && "Sample pricing and availability. "}USD is an estimate.</p>
          <ProductActions stone={stone} paymentsEnabled={Boolean(checkoutConfig())} />
        </div>
      </div>
    </div>
    <div className="product-details grid divide-y divide-emerald/15 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] lg:divide-x lg:divide-y-0">
      <section className="min-w-0 space-y-4 p-5 sm:p-8 lg:p-10" aria-labelledby="product-description">
        <h2 id="product-description" className="text-[clamp(2rem,3.5vw,3.15rem)]">Description</h2>
        <p className="whitespace-pre-line wrap-anywhere leading-relaxed">{stone.description}</p>
      </section>
      <section className="min-w-0 space-y-5 p-5 sm:p-8 lg:p-10" aria-labelledby="product-specifications">
        <h2 id="product-specifications" className="text-[clamp(2rem,3.5vw,3.15rem)]">Specifications</h2>
        <dl className="grid gap-x-6 sm:grid-cols-2">
          {details.map(([name, value]) => <div key={name} className="grid min-w-0 gap-1 border-t border-emerald/15 py-3">
            <dt className="text-sm font-semibold text-muted-foreground">{name}</dt>
            <dd className="wrap-anywhere">{value}</dd>
          </div>)}
        </dl>
      </section>
    </div>
    <Suspense fallback={null}><RelatedStones stone={stone} /></Suspense>
  </article>
}
