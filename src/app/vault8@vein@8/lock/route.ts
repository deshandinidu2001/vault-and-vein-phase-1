import { type NextRequest, NextResponse } from "next/server"
import { lockAdminSession } from "@/lib/admin-auth"
import { slugInput } from "@/lib/admin-product"

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin")
  const fetchSite = request.headers.get("sec-fetch-site")
  if (!origin || !URL.canParse(origin) || new URL(origin).host !== request.headers.get("host") ||
    (fetchSite && fetchSite !== "same-origin")) {
    return new NextResponse(null, { status: 403 })
  }

  const listing = slugInput.safeParse(request.nextUrl.searchParams.get("listing"))
  await lockAdminSession()
  return new NextResponse(null, {
    status: 303,
    headers: { Location: listing.success ? "/shop/" + listing.data : "/", "Cache-Control": "private, no-store" },
  })
}
