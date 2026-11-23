import { database } from "@/lib/backend"
import { checkoutConfig } from "@/lib/checkout"
import { readBody } from "@/lib/http"
import { notification } from "@/lib/payhere"

export async function POST(request: Request) {
  const config = checkoutConfig()
  if (!config) return new Response(null, { status: 503 })
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/x-www-form-urlencoded") {
    return new Response(null, { status: 415 })
  }

  try {
    const body = await readBody(request)
    const event = body && notification(new URLSearchParams(body), config.merchant, config.secret)
    if (!event) return new Response(null, { status: 400 })
    const [result] = await database().$queryRaw<{ accepted: boolean }[]>`
      SELECT public.apply_payment(${event.order}::uuid, ${event.amount}::numeric, ${event.payment}, ${event.status}) AS accepted
    `
    return new Response(null, { status: result?.accepted ? 200 : 400 })
  } catch {
    return new Response(null, { status: 503 })
  }
}
