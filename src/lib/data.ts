import "server-only"
import { mockStones } from "@/data/stones"
import { stoneCategory, type Stone } from "@/types/stone"
import { cache } from "react"
import { connection } from "next/server"
import { catalogueConfigured, publicDatabase } from "./backend"
import { getGemCategories } from "./gem-categories"

const loadCatalogue = cache(async (): Promise<Stone[]> => {
  if (!catalogueConfigured) return mockStones.map((stone) => ({ ...stone, is_sample: true }))
  await connection()
  const db = publicDatabase()
  const { categories, visibilityReady } = await getGemCategories()
  const categoryNames = new Map(categories.map(({ slug, name }) => [slug, name]))
  const stones: Stone[] = []
  const columns = "id,slug,name,gem_type,cut,carat,length_mm,width_mm,depth_mm,colour,clarity,treatment,origin,description,price_lkr,status,reserved_until,is_featured,is_sample,model_key,tint,certified,collections"
  for (let start = 0; ; start += 500) {
    const { data, error } = await db.from("products")
      .select(visibilityReady ? columns + ",image_url" : columns)
      .eq("is_published", true).order("slug").range(start, start + 499)
    if (error) throw new Error("The catalogue is temporarily unavailable.")
    const rows = data as (Stone & { reserved_until: string | null })[]
    for (const { reserved_until, ...stone } of rows) {
      if (stone.status === "reserved" && reserved_until && Date.parse(reserved_until) <= Date.now()) stone.status = "available"
      stones.push({ ...stone, categoryName: categoryNames.get(stone.gem_type) })
    }
    if (rows.length < 500) return stones
  }
})

export type StoneFilters = {
  q?: string; type?: string; cut?: string; colour?: string; origin?: string; collection?: string
  minCarat?: number; maxCarat?: number; minPrice?: number; maxPrice?: number
  certified?: boolean; sort?: string; page?: number
}

type Query = Record<string, string | string[] | undefined>
export const pageSize = 8

export function parseStoneFilters(query: Query): StoneFilters {
  const value = (key: string) => {
    const raw = query[key]
    return (typeof raw === "string" ? raw : raw?.[0])?.trim().slice(0, 100) || undefined
  }
  const number = (key: string) => {
    const raw = value(key)
    if (!raw) return undefined
    const parsed = Number(raw)
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined
  }
  return {
    q: value("q"), type: value("type"), cut: value("cut"), colour: value("colour"), origin: value("origin"), collection: value("collection"),
    minCarat: number("minCarat"), maxCarat: number("maxCarat"), minPrice: number("minPrice"), maxPrice: number("maxPrice"),
    certified: value("certified") === "1" || undefined, sort: value("sort"), page: Math.floor(number("page") ?? 1),
  }
}

const normalize = (value: string) => value.toLowerCase().trim()
const matches = (actual: string, expected?: string) => !expected || normalize(actual) === normalize(expected)
const featuredFirst = (a: Stone, b: Stone) => Number(b.is_featured) - Number(a.is_featured)

export async function getStones(filters: StoneFilters = {}) {
  const search = normalize(filters.q ?? "")
  const filtered = (await loadCatalogue()).filter((stone) =>
    matches(stone.gem_type, filters.type) &&
    matches(stone.cut, filters.cut) &&
    matches(stone.colour, filters.colour) &&
    matches(stone.origin, filters.origin) &&
    (!filters.collection || stone.collections.some((value) => matches(value, filters.collection))) &&
    (!filters.certified || stone.certified) &&
    stone.carat >= (filters.minCarat ?? 0) && stone.carat <= (filters.maxCarat ?? Infinity) &&
    stone.price_lkr >= (filters.minPrice ?? 0) && stone.price_lkr <= (filters.maxPrice ?? Infinity) &&
    (!search || search.split(/\s+/).every((word) =>
      normalize([stone.name, stoneCategory(stone), stone.colour, stone.cut, stone.origin, stone.description].join(" ")).includes(word))),
  )
  const sorters: Record<string, (a: Stone, b: Stone) => number> = {
    "price-asc": (a, b) => a.price_lkr - b.price_lkr,
    "price-desc": (a, b) => b.price_lkr - a.price_lkr,
    "carat-desc": (a, b) => b.carat - a.carat,
    name: (a, b) => a.name.localeCompare(b.name),
  }
  const sort = filters.sort
  filtered.sort(sort && Object.hasOwn(sorters, sort) ? sorters[sort] : featuredFirst)
  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(pages, Math.max(1, filters.page ?? 1))
  return { stones: filtered.slice((page - 1) * pageSize, page * pageSize), total, page, pages }
}

export async function getStoneBySlug(slug: string) {
  return (await loadCatalogue()).find((stone) => stone.slug === slug)
}

export async function getFeatured(limit = 8) {
  return [...await loadCatalogue()].sort(featuredFirst).slice(0, limit)
}

export async function getRelated(stone: Stone, limit = 4) {
  function similarity(item: Stone) {
    return (item.gem_type === stone.gem_type ? 3 : 0) +
      (item.collections.some((tag) => stone.collections.includes(tag)) ? 2 : 0) +
      (item.is_featured ? 1 : 0)
  }
  return (await loadCatalogue()).filter((item) => item.slug !== stone.slug)
    .sort((a, b) => similarity(b) - similarity(a)).slice(0, limit)
}

export async function getStoneOptions() {
  const [catalogue, { categories }] = await Promise.all([loadCatalogue(), getGemCategories()])
  const values = (key: "cut" | "colour" | "origin") => [...new Set(catalogue.map((stone) => stone[key]))].sort()
  return { cuts: values("cut"), colours: values("colour"), origins: values("origin"), types: categories.map(({ slug, name }) => [slug, name]) }
}

export async function getStoneSlugs() {
  return (await loadCatalogue()).map(({ slug }) => slug)
}
