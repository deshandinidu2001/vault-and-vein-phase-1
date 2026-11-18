import "server-only"
import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const service = process.env.SUPABASE_SERVICE_ROLE_KEY
export const catalogueConfigured = Boolean(url && anon)
export const backendConfigured = Boolean(url && anon && service)

function connect(key: string) {
  if (!url) throw new Error("Supabase URL is missing")
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
}

export function publicDatabase() {
  if (!anon) throw new Error("Supabase publishable key is missing")
  return connect(anon)
}

export function serviceDatabase() {
  if (!backendConfigured || !service) throw new Error("Supabase backend is not configured")
  return connect(service)
}
