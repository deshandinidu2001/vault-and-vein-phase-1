import type { MetadataRoute } from "next"
import { site } from "@/config/site"
import { getStoneSlugs } from "@/lib/data"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = ["/", "/shop", "/about", "/contact", "/shipping", "/returns", "/privacy", "/terms"]
  const products = (await getStoneSlugs()).map((slug) => "/shop/" + slug)
  return [...routes, ...products].map((path) => ({ url: new URL(path, site.url).href }))
}
