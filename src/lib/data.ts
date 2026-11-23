import "server-only"
import { mockStones } from "@/data/stones"
import { stoneCategory, type Stone } from "@/types/stone"
import { cache } from "react"
import { connection } from "next/server"
import { catalogueConfigured, CatalogueUnavailableError, publicDatabase } from "./backend"
import { getGemCategories, isMissingInventorySchema } from "./gem-categories"
import { gemModelCut } from "@/components/three/gem-shape"
import { normalizeShopOption, shopFilterConfig } from "./shop-filter-config"
import { getShopFilterSettings } from "./shop-filter-settings"
import type { GemCategory } from "@/types/stone"

const columns = "id,slug,name,gem_type,cut,carat,length_mm,width_mm,depth_mm,colour,clarity,treatment,origin,description,price_lkr,status,reserved_until,is_featured,is_sample,model_key,tint,certified,collections"
type ProductRow = Omit<Stone, "model_key"> & { model_key: string; reserved_until: string | null; gallery_urls?: string[] }

function catalogueStone({ reserved_until, ...stone }: ProductRow, categoryNames: Map<string, string>) {
  const expired = stone.status === "reserved" && reserved_until && Date.parse(reserved_until) <= Date.now()
  return { ...stone, status: expired ? "available" : stone.status, model_key: gemModelCut(stone.model_key), categoryName: categoryNames.get(stone.gem_type) }
}

const loadCatalogue = cache(async (): Promise<Stone[]> => {
  if (!catalogueConfigured) return mockStones.map((stone) => ({ ...stone, is_sample: true }))
  await connection()
  const db = publicDatabase()
  const batch = 500
  function fetchPage(start: number, includePhoto: boolean) {
    return db.from("products")
      .select(includePhoto ? columns + ",image_url" : columns)
      .eq("is_published", true).order("slug").range(start, start + batch - 1)
      .overrideTypes<ProductRow[], { merge: false }>()
  }
  const [first, { categories }] = await Promise.all([fetchPage(0, true), getGemCategories()])
  const categoryNames = new Map(categories.map(({ slug, name }) => [slug, name]))
  const includePhoto = !isMissingInventorySchema(first.error)
  let page = includePhoto ? first : await fetchPage(0, false)
  const stones: Stone[] = []
  for (let start = batch; ; start += batch) {
    const { data, error } = page
    if (error) throw new CatalogueUnavailableError("The catalogue is temporarily unavailable.")
    stones.push(...data.map(row => catalogueStone(row, categoryNames)))
    if (data.length < batch) return stones
    page = await fetchPage(start, includePhoto)
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
    return (typeof raw === "string" ? raw : raw?.[0])?.trim().slice(0, key === "q" ? 100 : 120) || undefined
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

const normalize = normalizeShopOption
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

async function selectPreview(limit: number, slug?: string) {
  await connection()
  const db = publicDatabase()
  function fetchRows(extraColumns: string) {
    const query = db.from("products").select(columns + extraColumns).eq("is_published", true)
    if (slug !== undefined) query.eq("slug", slug)
    return query.order("is_featured", { ascending: false }).order("slug").limit(limit)
      .overrideTypes<ProductRow[], { merge: false }>()
  }
  const [initial, { categories }] = await Promise.all([
    fetchRows(slug === undefined ? ",image_url" : ",image_url,gallery_urls"), getGemCategories(),
  ])
  // Older catalogues may have a cover photo but no gallery column yet.
  const withCover = slug !== undefined && isMissingInventorySchema(initial.error) ? await fetchRows(",image_url") : initial
  const { data, error } = isMissingInventorySchema(withCover.error) ? await fetchRows("") : withCover
  if (error) throw new CatalogueUnavailableError("The catalogue is temporarily unavailable.")
  const names = new Map(categories.map(({ slug, name }) => [slug, name]))
  return data.map(row => catalogueStone(row, names))
}

export const getStoneBySlug = cache(async (slug: string) => {
  if (!catalogueConfigured) {
    const stone = (await loadCatalogue()).find(stone => stone.slug === slug)
    return stone && { ...stone, gallery_urls: [] as string[] }
  }
  return (await selectPreview(1, slug))[0]
})

export async function getFeatured(limit = 8) {
  if (catalogueConfigured) return selectPreview(limit)
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

export async function getStoneOptions(adminCategories?: GemCategory[]) {
  const [catalogue, categories, { rows, ready }] = await Promise.all([
    loadCatalogue(),
    adminCategories ?? getGemCategories().then((result) => result.categories),
    getShopFilterSettings(),
  ])
  return { ...shopFilterConfig(rows, categories, catalogue), ready }
}

export async function getStoneSlugs() {
  return (await loadCatalogue()).map(({ slug }) => slug)
}
