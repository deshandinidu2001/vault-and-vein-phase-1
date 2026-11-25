import { checkoutConfig, checkoutInput, paymentForm, type CheckoutOrder } from "@/lib/checkout"
import { Prisma } from "@/generated/prisma/client"
import { database } from "@/lib/backend"
import { permitRequest, readJson } from "@/lib/http"

export async function POST(request: Request) {
  const config = checkoutConfig()
  if (!config) return Response.json({ message: "Online checkout is unavailable." }, { status: 503 })
  if (request.headers.get("origin") !== config.origin) return Response.json({ message: "Invalid checkout origin." }, { status: 403 })
  const input = checkoutInput.safeParse(await readJson(request))
  if (!input.success) return Response.json({ message: "Check your cart and delivery details." }, { status: 400 })
  const { ids, requestId, ...customer } = input.data

  try {
    if (!await permitRequest(request, "checkout", customer.email)) {
      return Response.json({ message: "Too many checkout attempts. Try again in a few minutes." }, { status: 429 })
    }
    const [{ data }] = await database().$queryRaw<{ data: CheckoutOrder }[]>`
      SELECT public.reserve_checkout(${ids}::uuid[], ${JSON.stringify(customer)}::jsonb, ${config.shipping}::integer, ${requestId}::uuid) AS data
    `
    return Response.json(paymentForm(config, customer, data), { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2010") {
      const driverError = error.meta?.driverAdapterError as { cause?: { originalCode?: string } } | undefined
      if (driverError?.cause?.originalCode === "P0001") {
        return Response.json({ message: "One or more stones are unavailable. Check your cart and try again." }, { status: 409 })
      }
    }
    return Response.json({ message: "We couldn’t start checkout. Try again shortly." }, { status: 503 })
  }
}
