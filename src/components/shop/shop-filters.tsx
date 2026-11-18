"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, SlidersHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { gemNames } from "@/types/stone"
import type { StoneFilters } from "@/lib/data"

const collections = [["engagement", "Engagement stones"], ["rare", "Collector rarities"], ["parcels", "Parcels for designers"]]
const sorts = [["featured", "Featured first"], ["price-asc", "Price: low to high"], ["price-desc", "Price: high to low"], ["carat-desc", "Carat: high to low"], ["name", "Name: A to Z"]]

type FiltersProps = { current: StoneFilters; options: { cuts: string[]; colours: string[]; origins: string[] } }

export function ShopFilters({ current, options }: FiltersProps) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(Boolean(current.cut || current.colour || current.origin || current.certified ||
    current.collection || current.minCarat !== undefined || current.maxCarat !== undefined || current.minPrice !== undefined || current.maxPrice !== undefined))

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const params = new URLSearchParams()
    new FormData(event.currentTarget).forEach((value, key) => {
      const filter = String(value).trim()
      if (filter && !(key === "sort" && filter === "featured")) params.set(key, filter)
    })
    const query = params.toString()
    router.push(query ? "/shop?" + query : "/shop")
  }

  return <form action="/shop" method="get" onSubmit={apply} className="grid gap-4 rounded-2xl border border-emerald/15 p-4 md:p-6">
    <div className="grid gap-3 md:grid-cols-[1fr_12rem_auto] md:items-end">
      <div className="grid gap-2">
        <label className="text-sm font-semibold" htmlFor="shop-query">Search the catalogue</label>
        <div className="relative">
          <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" />
          <Input id="shop-query" maxLength={100} name="q" type="search" defaultValue={current.q} className="h-12 pl-10" placeholder="Try cushion or blue…" />
        </div>
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-semibold" htmlFor="shop-sort">Sort by</label>
        <select id="shop-sort" name="sort" className="form-select" defaultValue={current.sort ?? "featured"}>
          {sorts.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
      </div>
      <button type="button" className="pill" aria-expanded={expanded} aria-controls="shop-filters" onClick={() => setExpanded(!expanded)}>
        <SlidersHorizontal size={18} aria-hidden="true" /> Filters
      </button>
    </div>
    <div id="shop-filters" hidden={!expanded}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["type", "Gem type", Object.entries(gemNames)],
          ["collection", "Collection", collections],
          ["cut", "Cut", options.cuts.map((value) => [value, value])],
          ["colour", "Colour", options.colours.map((value) => [value, value])],
          ["origin", "Origin", options.origins.map((value) => [value, value])],
        ].map(([name, label, choices]) => {
          const key = name as "type" | "collection" | "cut" | "colour" | "origin"
          return <div key={key} className="grid gap-2">
            <label htmlFor={"shop-" + key} className="text-sm font-semibold">{String(label)}</label>
            <select id={"shop-" + key} className="form-select" name={key} defaultValue={current[key] ?? ""}>
              <option value="">Any</option>
              {(choices as string[][]).map(([value, text]) => <option key={value} value={value}>{text}</option>)}
            </select>
          </div>
        })}
        <label className="flex min-h-12 items-center gap-2 self-end text-sm font-semibold">
          <input type="checkbox" name="certified" value="1" defaultChecked={current.certified} className="size-5 accent-emerald" />
          Certified sample stones
        </label>
        <fieldset className="min-w-0">
          <legend className="text-sm font-semibold">Carat range (ct)</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Input name="minCarat" type="number" min={0} step="any" defaultValue={current.minCarat} aria-label="Minimum carat" placeholder="Min" className="h-12" />
            <Input name="maxCarat" type="number" min={0} step="any" defaultValue={current.maxCarat} aria-label="Maximum carat" placeholder="Max" className="h-12" />
          </div>
        </fieldset>
        <fieldset className="min-w-0">
          <legend className="text-sm font-semibold">Price range (LKR)</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Input name="minPrice" type="number" min={0} step="any" defaultValue={current.minPrice} aria-label="Minimum price in LKR" placeholder="Min" className="h-12" />
            <Input name="maxPrice" type="number" min={0} step="any" defaultValue={current.maxPrice} aria-label="Maximum price in LKR" placeholder="Max" className="h-12" />
          </div>
        </fieldset>
      </div>
    </div>
    <div className="flex flex-wrap items-center gap-4">
      <button type="submit" className="pill pill-primary">Apply filters</button>
      <Link href="/shop" className="line-link text-sm">Clear filters</Link>
    </div>
  </form>
}
