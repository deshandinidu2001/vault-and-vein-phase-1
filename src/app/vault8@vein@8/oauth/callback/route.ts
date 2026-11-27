import { NextResponse } from "next/server"

export function GET() {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: "/vault8@vein@8/login", "Cache-Control": "private, no-store" },
  })
}
