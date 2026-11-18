import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { ProductActions } from "@/components/product/product-actions"
import { ProductGallery } from "@/components/product/product-gallery"
import { StoneCard } from "@/components/shop/stone-card"
import { StonePrice } from "@/components/shop/stone-price"
import { Badge } from "@/components/ui/badge"
import { getRelated, getStoneBySlug } from "@/lib/data"
import { gemNames, type Stone } from "@/types/stone"
import { site } from "@/config/site"
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
    category: gemNames[stone.gem_type],
    color: stone.colour,
    description: (stone.is_sample ? "Sample listing. " : "") + stone.description,
    url: new URL(path, site.url).href,
    image: new URL("/images/stones/" + stone.slug, site.url).href,
    brand: { "@type": "Brand", name: site.name },
    additionalProperty: [
      { "@type": "PropertyValue", name: "Cut", value: stone.cut },
      { "@type": "PropertyValue", name: "Carat", value: stone.carat },
      { "@type": "PropertyValue", name: "Illustrative price (LKR)", value: stone.price_lkr },
    ],
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(product) }} />
}

export default async function StoneDetail({ params }: Props) {
  const { slug } = await params
  const stone = await getStoneBySlug(slug)
  if (!stone) notFound()
  const related = await getRelated(stone)
  const details = [
    ["Gem type", gemNames[stone.gem_type]], ["Cut", stone.cut], ["Weight", stone.carat + " ct"],
    ["Dimensions", [stone.length_mm, stone.width_mm, stone.depth_mm].join(" × ") + " mm"],
    ["Colour", stone.colour], ["Clarity", stone.clarity], ["Treatment", stone.treatment], ["Origin", stone.origin],
    ["Lab report", stone.certified ? (stone.is_sample ? "Indicated in sample record" : "Available on request") : "Not listed"],
  ]

  return <article className="wrap section shop-page space-y-6 md:space-y-8">
    <ProductData stone={stone} />
    <Link href="/shop" className="line-link text-sm"><ArrowLeft size={18} aria-hidden="true" /> Back to the shop</Link>
    <div className="film-grid !items-start">
      <ProductGallery stone={stone} />
      <div className="grid gap-5">
        <p className="eyebrow text-[#785520]">{gemNames[stone.gem_type]}{stone.is_sample && " / Sample stone"}</p>
        <h1 className="text-[clamp(3rem,6vw,5.8rem)]">{stone.name}</h1>
        <p>{stone.description}</p>
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-xl font-semibold text-emerald"><StonePrice lkr={stone.price_lkr} both /></span>
          <Badge variant="outline" className="capitalize">{stone.status}</Badge>
        </div>
        <ProductActions stone={stone} />
        <p className="text-sm text-muted-foreground">{stone.is_sample && "Sample pricing and availability. "}USD is an estimate.</p>
        <table className="w-full border-t border-emerald/20 text-sm">
          <caption className="sr-only">Specifications for {stone.name}</caption>
          <tbody>{details.map(([name, value]) => <tr className="border-b border-emerald/15" key={name}>
            <th scope="row" className="py-3 pr-4 text-left font-semibold">{name}</th><td className="py-3">{value}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </div>
    {related.length > 0 && <section className="grid gap-6 border-t border-emerald/15 pt-12">
      <h2>Related stones</h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{related.map((item) => <li key={item.id}><StoneCard stone={item} /></li>)}</ul>
    </section>}
  </article>
}
