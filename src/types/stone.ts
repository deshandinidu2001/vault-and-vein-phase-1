import type { GemCut } from "@/components/three/gem-shape"

export type GemType = string
export type GemCategory = { slug: string; name: string; is_visible: boolean }
export type StoneStatus = "available" | "reserved" | "sold"

export type Stone = {
  id: string
  slug: string
  name: string
  gem_type: GemType
  categoryName?: string
  image_url?: string | null
  cut: string
  carat: number
  length_mm: number
  width_mm: number
  depth_mm: number
  colour: string
  clarity: string
  treatment: string
  origin: string
  description: string
  price_lkr: number
  status: StoneStatus
  is_featured: boolean
  is_sample?: boolean
  model_key: GemCut
  tint: string
  certified: boolean
  collections: string[]
}

export const gemNames: Record<string, string | undefined> = {
  sapphire: "Sapphire", spinel: "Spinel", garnet: "Garnet", alexandrite: "Alexandrite", chrysoberyl: "Chrysoberyl",
}

export function stoneCategory(stone: Pick<Stone, "gem_type" | "categoryName">) {
  return stone.categoryName ?? (Object.hasOwn(gemNames, stone.gem_type) ? gemNames[stone.gem_type] : undefined) ?? stone.gem_type
}
