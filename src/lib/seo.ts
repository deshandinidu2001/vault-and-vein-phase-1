import type { Metadata } from "next"
import { site } from "@/config/site"

export function pageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title, description,
    alternates: { canonical: path },
    openGraph: { title: title + " | " + site.name, description, url: path, siteName: site.name, type: "website" },
  }
}

export function serializeJsonLd(value: Record<string, unknown>) {
  return JSON.stringify(value).replace(/</g, "\\u003c")
}
