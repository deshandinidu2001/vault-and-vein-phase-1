"use client"

import { useState, useTransition, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, SlidersHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { StoneFilters } from "@/lib/data"
import { normalizeShopOption, shopFilterControls, shopSelectFilters, type ShopFilterConfig } from "@/lib/shop-filter-config"

export function ShopFilters({ current, config }: { current: StoneFilters; config: ShopFilterConfig }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [expanded, setExpanded] = useState(Boolean(current.type || current.cut || current.colour || current.origin || current.certified ||
    current.collection || current.minCarat !== undefined || current.maxCarat !== undefined || current.minPrice !== undefined || current.maxPrice !== undefined))
  const { controls, options } = config
  const selects = shopSelectFilters.filter((key) => controls[key] && options[key].some((option) => option.isVisible))
  const sorts = controls.sort ? options.sort.filter((option) => option.isVisible) : []
  const selectedSort = current.sort ?? "featured"
  const defaultSort = sorts.some(({ value }) => value === selectedSort) ? selectedSort : ""
  const advanced = selects.length > 0 || controls.certified || controls.carat || controls.price
  if (!controls.q && !sorts.length && !advanced) return null

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const params = new URLSearchParams()
    new FormData(event.currentTarget).forEach((value, key) => {
      const filter = String(value).trim()
      if (filter && !(key === "sort" && filter === "featured")) params.set(key, filter)
    })
    const query = params.toString()
    startTransition(() => router.push(query ? "/shop?" + query : "/shop"))
  }

  return <form action="/shop" method="get" onSubmit={apply} aria-busy={pending} className="grid gap-4 rounded-2xl border border-emerald/15 p-4 md:p-6">
    <div className="flex flex-wrap items-end gap-3">
      {controls.q && <div className="grid w-full gap-2 md:w-auto md:min-w-56 md:flex-1">
        <label className="text-sm font-semibold" htmlFor="shop-query">Search the catalogue</label>
        <div className="relative">
          <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" />
          <Input id="shop-query" maxLength={100} name="q" type="search" defaultValue={current.q} className="h-12 pl-10" placeholder="Try cushion or blue…" />
        </div>
      </div>}
      {sorts.length > 0 && <div className="grid w-full gap-2 sm:w-auto sm:min-w-48">
        <label className="text-sm font-semibold" htmlFor="shop-sort">Sort by</label>
        <select id="shop-sort" name="sort" className="form-select" defaultValue={defaultSort}>
          {!defaultSort && <option value="" hidden>Choose a sort order</option>}
          {sorts.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>}
      {advanced && <button type="button" className="pill" aria-expanded={expanded} aria-controls="shop-filters" onClick={() => setExpanded(!expanded)}>
        <SlidersHorizontal size={18} aria-hidden="true" /> Filters
      </button>}
    </div>
    {advanced && <div id="shop-filters" hidden={!expanded}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {selects.map((key) => {
          const choices = options[key].filter((option) => option.isVisible)
          const selected = normalizeShopOption(current[key] ?? "")
          return <div key={key} className="grid gap-2">
            <label htmlFor={"shop-" + key} className="text-sm font-semibold">{shopFilterControls[key]}</label>
            <select id={"shop-" + key} className="form-select" name={key}
              defaultValue={choices.some(({ value }) => value === selected) ? selected : ""}>
              <option value="">Any</option>
              {choices.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
        })}
        {controls.certified && <label className="flex min-h-12 items-center gap-2 self-end text-sm font-semibold">
          <input type="checkbox" name="certified" value="1" defaultChecked={current.certified} className="size-5 accent-emerald" />
          Lab report available
        </label>}
        {controls.carat && <fieldset className="min-w-0">
          <legend className="text-sm font-semibold">Carat range (ct)</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Input name="minCarat" type="number" min={0} step="any" defaultValue={current.minCarat} aria-label="Minimum carat" placeholder="Min" className="h-12" />
            <Input name="maxCarat" type="number" min={0} step="any" defaultValue={current.maxCarat} aria-label="Maximum carat" placeholder="Max" className="h-12" />
          </div>
        </fieldset>}
        {controls.price && <fieldset className="min-w-0">
          <legend className="text-sm font-semibold">Price range (LKR)</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Input name="minPrice" type="number" min={0} step="any" defaultValue={current.minPrice} aria-label="Minimum price in LKR" placeholder="Min" className="h-12" />
            <Input name="maxPrice" type="number" min={0} step="any" defaultValue={current.maxPrice} aria-label="Maximum price in LKR" placeholder="Max" className="h-12" />
          </div>
        </fieldset>}
      </div>
    </div>}
    <div className="flex flex-wrap items-center gap-4">
      <button type="submit" className="pill pill-primary" disabled={pending}>{pending ? "Applying…" : "Apply filters"}</button>
      <Link href="/shop" className="line-link text-sm">Clear filters</Link>
    </div>
  </form>
}
