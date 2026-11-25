import { existsSync, readFileSync } from "node:fs"
import { Client } from "pg"
import { z } from "zod"
import { sampleStones } from "../src/data/sample-stones.ts"
import { parseProductPhoto } from "../src/lib/product-photo.ts"

for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) process.loadEnvFile(file)
}

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DIRECT_URL || process.env.DATABASE_URL
if (!url) throw new Error("Configure the database before seeding sample listings.")

const photos = process.argv[2]
  ? z.record(z.string(), z.string().refine((url) => Boolean(parseProductPhoto(url))))
    .parse(JSON.parse(readFileSync(process.argv[2], "utf8")))
  : {}
const samples = sampleStones.map((stone) => {
  const slug = "sample-" + stone.slug
  return {
    ...stone, slug, image_url: photos[slug] ?? null,
    // Demonstration reservations never acquire real stock holds.
    status: stone.status === "sold" ? "sold" : "available",
  }
})

const client = new Client({ connectionString: url, connectionTimeoutMillis: 10000 })
try {
  await client.connect()
  const inserted = await client.query(`
    INSERT INTO public.products (
      slug, name, gem_type, cut, carat, length_mm, width_mm, depth_mm, colour, clarity, treatment,
      origin, description, price_lkr, status, is_featured, tint, certified, collections, image_url,
      is_sample, is_published
    )
    SELECT s.slug, s.name, s.gem_type, s.cut, s.carat, s.length_mm, s.width_mm, s.depth_mm, s.colour,
      s.clarity, s.treatment, s.origin, s.description, s.price_lkr, s.status, s.is_featured, s.tint,
      s.certified, s.collections,
      CASE WHEN EXISTS (SELECT 1 FROM public.products p WHERE p.image_url = s.image_url)
        THEN NULL ELSE s.image_url END,
      true, true
    FROM jsonb_to_recordset($1::jsonb) AS s(
      slug text, name text, gem_type text, cut text, carat numeric, length_mm numeric, width_mm numeric,
      depth_mm numeric, colour text, clarity text, treatment text, origin text, description text,
      price_lkr integer, status text, is_featured boolean, tint text, certified boolean, collections text[],
      image_url text
    )
    ON CONFLICT (slug) DO NOTHING
  `, [JSON.stringify(samples)])
  console.log("Sample catalogue: inserted " + inserted.rowCount + ", skipped " + (samples.length - inserted.rowCount) + " existing slugs.")
} catch (error) {
  console.error("Could not seed the sample catalogue.", error.code ?? "")
  process.exitCode = 1
} finally {
  await client.end()
}
