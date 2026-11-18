import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { ProductActions } from "@/components/product/product-actions"
import { ProductGallery } from "@/components/product/product-gallery"
import { StoneCard } from "@/components/shop/stone-card"
import { StonePrice } from "@/components/shop/stone-price"
import { Badge } from "@/components/ui/badge"
import { getRelated, getStoneBySlug, getStoneSlugs } from "@/lib/data"
import { gemNames } from "@/types/stone"

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return (await getStoneSlugs()).map((slug) => ({ slug }))
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
    ["Lab report", stone.certified ? "Indicated in sample record" : "None in sample record"],
  ]

  return <article className="wrap section page-top space-y-10">
    <Link href="/shop" className="line-link text-sm"><ArrowLeft size={18} aria-hidden="true" /> Back to the shop</Link>
    <div className="film-grid !items-start">
      <ProductGallery stone={stone} />
      <div className="grid gap-5">
        <p className="eyebrow text-[#785520]">{gemNames[stone.gem_type]} / Sample stone</p>
        <h1 className="text-[clamp(3rem,6vw,5.8rem)]">{stone.name}</h1>
        <p>{stone.description}</p>
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-xl font-semibold text-emerald"><StonePrice lkr={stone.price_lkr} both /></span>
          <Badge variant="outline" className="capitalize">{stone.status}</Badge>
        </div>
        <ProductActions stone={stone} />
        <p className="text-sm text-muted-foreground">Sample pricing and availability. USD uses an illustrative conversion rate.</p>
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
