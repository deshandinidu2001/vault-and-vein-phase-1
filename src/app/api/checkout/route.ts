import { checkoutConfig, checkoutInput, paymentForm } from "@/lib/checkout"
import { serviceDatabase } from "@/lib/backend"
import { permitRequest, readJson } from "@/lib/http"

export async function POST(request: Request) {
  const config = checkoutConfig()
  if (!config) return Response.json({ message: "Online checkout is unavailable." }, { status: 503 })
  if (request.headers.get("origin") !== config.origin) return Response.json({ message: "Invalid checkout origin." }, { status: 403 })
  const input = checkoutInput.safeParse(await readJson(request))
  if (!input.success) return Response.json({ message: "Check your cart and delivery details." }, { status: 400 })
  const { ids, ...customer } = input.data

  try {
    if (!await permitRequest(request, "checkout", customer.email)) {
      return Response.json({ message: "Too many checkout attempts. Try again in a few minutes." }, { status: 429 })
    }
    const { data, error } = await serviceDatabase().rpc("reserve_checkout", {
      p_ids: ids, p_customer: customer, p_shipping: config.shipping,
    })
    if (error?.code === "P0001") {
      return Response.json({ message: "One or more stones are unavailable. Check your cart and try again." }, { status: 409 })
    }
    if (error || !data) return Response.json({ message: "We couldn’t start checkout. Try again shortly." }, { status: 503 })
    return Response.json(paymentForm(config, customer, data), { headers: { "Cache-Control": "no-store" } })
  } catch {
    return Response.json({ message: "We couldn’t start checkout. Try again shortly." }, { status: 503 })
  }
}
