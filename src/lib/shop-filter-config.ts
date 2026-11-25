import type { GemCategory } from "@/types/stone"

export const shopFilterControls = {
  q: "Search the catalogue",
  sort: "Sort by",
  type: "Gem type",
  collection: "Collection",
  cut: "Cut",
  colour: "Colour",
  origin: "Origin",
  certified: "Lab report available",
  carat: "Carat range (ct)",
  price: "Price range (LKR)",
} as const

export const shopSelectFilters = ["type", "collection", "cut", "colour", "origin"] as const
export const configurableShopOptions = ["collection", "cut", "colour", "origin"] as const
export type ShopFilterKey = keyof typeof shopFilterControls
export type ShopOptionKey = typeof shopSelectFilters[number] | "sort"
export type ShopFilterOption = { value: string; label: string; isVisible: boolean }
export type ShopFilterRow = { filter_key: ShopFilterKey; value: string; label: string; is_visible: boolean }
type FilterProduct = { cut: string; colour: string; origin: string; collections: string[] }

export const normalizeShopOption = (value: string) => value.trim().toLowerCase()

export function customShopOption(key: typeof configurableShopOptions[number] | "type", label: string) {
  const value = normalizeShopOption(label)
  return key === "collection" || key === "type"
    ? value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    : value
}

const sortLabels = {
  featured: "Featured first",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  "carat-desc": "Carat: high to low",
  name: "Name: A to Z",
}
const collectionLabels = {
  engagement: "Engagement stones",
  rare: "Collector rarities",
  parcels: "Parcels for designers",
}

export function shopFilterConfig(
  rows: ShopFilterRow[],
  categories: GemCategory[] = [],
  products: FilterProduct[] = [],
) {
  const controls = Object.fromEntries(Object.keys(shopFilterControls).map((key) => [key, true])) as Record<ShopFilterKey, boolean>
  const choices: Record<ShopOptionKey, Map<string, ShopFilterOption>> = {
    type: new Map(), collection: new Map(), cut: new Map(), colour: new Map(), origin: new Map(), sort: new Map(),
  }
  function add(key: ShopOptionKey, rawValue: string, label: string) {
    const value = normalizeShopOption(rawValue)
    if (value && !choices[key].has(value)) choices[key].set(value, { value, label, isVisible: true })
  }

  for (const { slug, name, is_visible } of categories) {
    choices.type.set(slug, { value: slug, label: name, isVisible: is_visible })
  }
  for (const [value, label] of Object.entries(sortLabels)) add("sort", value, label)
  for (const [value, label] of Object.entries(collectionLabels)) add("collection", value, label)
  for (const cut of ["Oval", "Cushion", "Round", "Emerald", "Pear", "Trillion"]) add("cut", cut, cut)
  for (const product of products) {
    for (const key of ["cut", "colour", "origin"] as const) add(key, product[key], product[key])
    for (const value of product.collections) add("collection", value, value)
  }

  for (const { filter_key: key, value, label, is_visible: isVisible } of rows) {
    if (!value) controls[key] = isVisible
    else if (key === "sort") {
      const existing = choices[key].get(value)
      if (existing) existing.isVisible = isVisible
    } else if (key === "collection" || key === "cut" || key === "colour" || key === "origin") {
      choices[key].set(value, { value, label, isVisible })
    }
  }

  const list = (key: ShopOptionKey) => [...choices[key].values()]
  return {
    controls,
    options: {
      type: list("type"),
      sort: list("sort"),
      collection: list("collection"),
      cut: list("cut"),
      colour: list("colour").sort((a, b) => a.label.localeCompare(b.label)),
      origin: list("origin").sort((a, b) => a.label.localeCompare(b.label)),
    },
  }
}

export type ShopFilterConfig = ReturnType<typeof shopFilterConfig>
