import { z } from "zod"

const shortText = z.string().trim().min(1).max(120)
const dimension = z.coerce.number().min(.01).max(999999.99).multipleOf(.01)
export const slugInput = z.string().trim().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(80)

export const productInput = z.object({
  slug: slugInput,
  name: shortText,
  gem_type: slugInput,
  cut: shortText,
  carat: dimension,
  length_mm: dimension,
  width_mm: dimension,
  depth_mm: dimension,
  colour: shortText,
  clarity: shortText,
  treatment: shortText,
  origin: shortText,
  description: z.string().trim().min(1).max(3000),
  price_lkr: z.coerce.number().int().min(1).max(100000000),
  tint: z.string().regex(/^#[0-9a-f]{6}$/i),
  certified: z.boolean(),
  is_featured: z.boolean(),
  is_published: z.boolean(),
  is_sample: z.boolean(),
  collections: z.array(slugInput).max(32),
})
export type ProductInput = z.infer<typeof productInput>
export const productFlags = [
  { name: "certified", label: "Lab report available" },
  { name: "is_featured", label: "Featured" },
  { name: "is_sample", label: "Sample listing" },
  { name: "is_published", label: "Published" },
] as const
