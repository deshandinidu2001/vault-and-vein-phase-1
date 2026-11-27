import "server-only"
import { stoneCategory, type Stone } from "@/types/stone"
import { cache } from "react"
import { connection } from "next/server"
import { catalogueConfigured, CatalogueUnavailableError, database } from "./backend"
import { getGemCategories } from "./gem-categories"
import { normalizeShopOption, shopFilterConfig } from "./shop-filter-config"
import { getShopFilterSettings } from "./shop-filter-settings"
import type { Prisma } from "@/generated/prisma/client"
import type { GemCategory } from "@/types/stone"

const catalogueFilter = {
  is_published: true,
  archived_at: null,
  category: { is_visible: true },
} satisfies Prisma.ProductWhereInput

const catalogueFields = {
  id: true, slug: true, name: true, gem_type: true, category: { select: { name: true } },
  cut: true, carat: true, length_mm: true, width_mm: true, depth_mm: true, colour: true,
  clarity: true, treatment: true, origin: true, description: true, price_lkr: true,
  status: true, reserved_until: true, is_featured: true, is_sample: true,
  certified: true, collections: true, image_url: true,
} satisfies Prisma.ProductSelect

function catalogueStone<T extends Prisma.ProductGetPayload<{ select: typeof catalogueFields }>>(
  { reserved_until, category, ...stone }: T,
) {
  const expired = stone.status === "reserved" && reserved_until && reserved_until.getTime() <= Date.now()
  return {
    ...stone,
    status: expired ? "available" as const : stone.status as Stone["status"],
    categoryName: category.name,
    carat: stone.carat.toNumber(), length_mm: stone.length_mm.toNumber(),
    width_mm: stone.width_mm.toNumber(), depth_mm: stone.depth_mm.toNumber(),
  }
}

const loadCatalogue = cache(async (): Promise<Stone[]> => {
  if (!catalogueConfigured) return []
  await connection()
  try {
    const products = await database().product.findMany({
      select: catalogueFields, where: catalogueFilter, orderBy: { slug: "asc" },
    })
    return products.map(catalogueStone)
  } catch {
    throw new CatalogueUnavailableError("The catalogue is temporarily unavailable.")
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

async function selectPreview(limit: number) {
  try {
    const products = await database().product.findMany({
      select: catalogueFields, where: { ...catalogueFilter, is_sample: false }, take: limit,
      orderBy: [{ is_featured: "desc" }, { slug: "asc" }],
    })
    return products.map(catalogueStone)
  } catch {
    throw new CatalogueUnavailableError("The catalogue is temporarily unavailable.")
  }
}

export const getStoneBySlug = cache(async (slug: string) => {
  if (!catalogueConfigured) return undefined
  await connection()
  try {
    const product = await database().product.findUnique({
      where: { slug, ...catalogueFilter },
      select: { ...catalogueFields, gallery_urls: true },
    })
    return product ? catalogueStone(product) : undefined
  } catch {
    throw new CatalogueUnavailableError("The catalogue is temporarily unavailable.")
  }
})

export async function getFeatured(limit = 8) {
  // The hosted Worker can receive its database secret after the build.
  await connection()
  return catalogueConfigured ? selectPreview(limit) : []
}

export async function getRelated(stone: Stone, limit = 4) {
  function similarity(item: Stone) {
    return (item.gem_type === stone.gem_type ? 3 : 0) +
      (item.collections.some((tag) => stone.collections.includes(tag)) ? 2 : 0) +
      (item.is_featured ? 1 : 0)
  }
  return (await loadCatalogue()).filter((item) => item.slug !== stone.slug && item.is_sample === stone.is_sample)
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
  return (await loadCatalogue()).filter(({ is_sample }) => !is_sample).map(({ slug }) => slug)
}
