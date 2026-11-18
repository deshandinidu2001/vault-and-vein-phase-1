import "server-only"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { backendConfigured, serviceDatabase } from "./backend"

export async function adminSession() {
  const store = await cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookieOptions: { httpOnly: true },
    cookies: {
      getAll: () => store.getAll(),
      setAll: (changes) => {
        // Proxy refreshes the session before Server Components read it.
        try {
          changes.forEach(({ name, value, options }) => store.set(name, value, options))
        } catch {
          // Server Components cannot set cookies.
        }
      },
    },
  })
}

export async function hasAdminAccess(userId: string) {
  const { data, error } = await serviceDatabase().from("admin_users").select("user_id").eq("user_id", userId).maybeSingle()
  return !error && Boolean(data)
}

export async function requireAdminDatabase() {
  if (!backendConfigured) redirect("/admin/login")
  const session = await adminSession()
  const { data: { user }, error } = await session.auth.getUser()
  if (error || !user || !await hasAdminAccess(user.id)) redirect("/admin/login")
  return serviceDatabase()
}
