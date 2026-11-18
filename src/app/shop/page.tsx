import Link from "next/link"
import { Suspense } from "react"
import { ShopFilters } from "@/components/shop/shop-filters"
import { StoneCard } from "@/components/shop/stone-card"
import { ShopSkeleton } from "@/components/shop/shop-skeleton"
import { getStoneOptions, getStones, parseStoneFilters, type StoneFilters } from "@/lib/data"

import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata("Shop", "Browse and filter cut and polished gemstones in the Vault & Vein sample catalogue.", "/shop")

type Query = Record<string, string | string[] | undefined>

function pageLink(query: Query, page: number) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (key !== "page" && typeof value === "string" && value) params.set(key, value)
  }
  if (page > 1) params.set("page", String(page))
  return params.size ? "/shop?" + params.toString() + "#results" : "/shop#results"
}

async function Results({ filters, query }: { filters: StoneFilters; query: Query }) {
  const { stones, total, page, pages } = await getStones(filters)
  return <section id="results" className="space-y-6" aria-labelledby="results-title">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 id="results-title" className="text-4xl">Sample stones</h2>
      <p role="status" className="text-sm text-muted-foreground">{total} {total === 1 ? "stone" : "stones"} found</p>
    </div>
    {stones.length ? <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {stones.map((stone) => <li key={stone.id}><StoneCard stone={stone} /></li>)}
    </ul> : <div className="grid justify-items-start gap-3 rounded-2xl border border-emerald/15 p-8">
      <h3>No stones match these filters.</h3>
      <p>Try a wider range or clear the filters to see the full sample catalogue.</p>
      <Link href="/shop" className="pill">Clear filters</Link>
    </div>}
    {pages > 1 && <nav className="flex flex-wrap items-center gap-2" aria-label="Catalogue pages">
      {page > 1 && <Link className="pill" href={pageLink(query, page - 1)}>Previous</Link>}
      {Array.from({ length: pages }, (_, index) => index + 1).map((number) => (
        <Link className={"pill " + (number === page ? "pill-primary" : "")} aria-label={"Page " + number}
          aria-current={number === page ? "page" : undefined} key={number} href={pageLink(query, number)}>{number}</Link>
      ))}
      {page < pages && <Link className="pill" href={pageLink(query, page + 1)}>Next</Link>}
    </nav>}
  </section>
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<Query> }) {
  const [query, options] = await Promise.all([searchParams, getStoneOptions()])
  const filters = parseStoneFilters(query)
  const key = JSON.stringify(filters)
  return <div className="wrap page-top section space-y-10">
    <div className="space-y-5">
      <p className="eyebrow text-[#785520]">The catalogue</p>
      <h1>Shop the stones.</h1>
      <p>Compare cuts, colours and dimensions across our sample collection. Prices, availability and report details are illustrative.</p>
    </div>
    <ShopFilters key={key} current={filters} options={options} />
    <Suspense key={key} fallback={<ShopSkeleton />}><Results filters={filters} query={query} /></Suspense>
  </div>
}
