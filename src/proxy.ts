import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

export async function proxy(request: NextRequest) {
  const admin = request.nextUrl.pathname === "/admin" || request.nextUrl.pathname.startsWith("/admin/")
  const paymentHost = process.env.PAYHERE_MODE === "live" ? "https://www.payhere.lk" : "https://sandbox.payhere.lk"
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64")
  const policy = [
    "default-src 'self'", "script-src 'self' 'nonce-" + nonce + "' 'strict-dynamic'" + (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""),
    "script-src-attr 'none'", "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob: https://res.cloudinary.com",
    "object-src 'none'", "base-uri 'none'", "frame-src 'none'", "frame-ancestors 'none'",
    admin ? "form-action 'self'" : "form-action 'self' " + paymentHost,
  ].join("; ")
  function forward() {
    const headers = new Headers(request.headers)
    headers.set("Content-Security-Policy", policy)
    const response = NextResponse.next({ request: { headers } })
    response.headers.set("Content-Security-Policy", policy)
    response.headers.set("Cache-Control", "private, no-store")
    response.headers.set("Referrer-Policy", "no-referrer")
    return response
  }
  let response = forward()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!admin || !url || !key) return response

  const supabase = createServerClient(url, key, {
    cookieOptions: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (changes) => {
        changes.forEach(({ name, value }) => request.cookies.set(name, value))
        response = forward()
        changes.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })
  await supabase.auth.getClaims()
  return response
}

export const config = { matcher: ["/admin/:path*", "/checkout", "/order/:path*"] }
