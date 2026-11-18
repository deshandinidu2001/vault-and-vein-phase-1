import type { GemCut } from "@/components/three/gem-shape"

export type GemType = "sapphire" | "spinel" | "garnet" | "alexandrite" | "chrysoberyl"
export type StoneCollection = "engagement" | "rare" | "parcels"
export type StoneStatus = "available" | "reserved" | "sold"

export type Stone = {
  id: string
  slug: string
  name: string
  gem_type: GemType
  cut: GemCut
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
  collections: StoneCollection[]
}

export const gemNames: Record<GemType, string> = {
  sapphire: "Sapphire", spinel: "Spinel", garnet: "Garnet", alexandrite: "Alexandrite", chrysoberyl: "Chrysoberyl",
}
