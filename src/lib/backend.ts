import "server-only"
import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const service = process.env.SUPABASE_SERVICE_ROLE_KEY
export const catalogueConfigured = Boolean(url && anon)
export const backendConfigured = Boolean(url && anon && service)

export class CatalogueUnavailableError extends Error {}

function connect(key: string, request?: typeof fetch) {
  if (!url) throw new Error("Supabase URL is missing")
  return createClient(url, key, { global: { fetch: request }, auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
}

export function publicDatabase() {
  if (!anon) throw new Error("Supabase publishable key is missing")
  return connect(anon)
}

export function serviceDatabase() {
  if (!backendConfigured || !service) throw new Error("Supabase backend is not configured")
  return connect(service)
}

export const publicSettingsTag = "public-shop-settings"

// Only public category labels and filter settings use this shared cache.
export function publicSettingsDatabase() {
  if (!anon) throw new Error("Supabase publishable key is missing")
  return connect(anon, (input, init) => fetch(input, {
    ...init, cache: "force-cache", next: { revalidate: 60, tags: [publicSettingsTag] },
  }))
}
