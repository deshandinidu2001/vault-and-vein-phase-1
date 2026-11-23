import { type NextRequest, NextResponse } from "next/server"

export function proxy(request: NextRequest) {
  const admin = request.nextUrl.pathname === "/admin" || request.nextUrl.pathname.startsWith("/admin/")
  const paymentHost = process.env.PAYHERE_MODE === "live" ? "https://www.payhere.lk" : "https://sandbox.payhere.lk"
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64")
  const policy = [
    "default-src 'self'", "script-src 'self' 'nonce-" + nonce + "' 'strict-dynamic'" + (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""),
    "script-src-attr 'none'", "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob: https://res.cloudinary.com",
    "object-src 'none'", "base-uri 'none'", "frame-src 'none'", "frame-ancestors 'none'",
    admin ? "form-action 'self'" : "form-action 'self' " + paymentHost,
  ].join("; ")
  const headers = new Headers(request.headers)
  headers.set("Content-Security-Policy", policy)
  const response = NextResponse.next({ request: { headers } })
  response.headers.set("Content-Security-Policy", policy)
  response.headers.set("Cache-Control", "private, no-store")
  response.headers.set("Referrer-Policy", "no-referrer")
  return response
}

export const config = { matcher: ["/admin/:path*", "/checkout", "/order/:path*"] }
