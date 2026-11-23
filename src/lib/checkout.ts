import "server-only"
import { z } from "zod"
import { backendConfigured, database } from "./backend"
import { asPayHereAmount, checkoutHash, payhereEndpoints } from "./payhere"

export const checkoutInput = z.object({
  requestId: z.uuid(),
  ids: z.array(z.uuid()).min(1).max(12).refine((ids) => new Set(ids).size === ids.length),
  first_name: z.string().trim().min(1).max(80),
  last_name: z.string().trim().min(1).max(80),
  email: z.email().max(254),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,24}$/).refine((phone) => phone.replace(/\D/g, "").length >= 7),
  address: z.string().trim().min(5).max(200),
  city: z.string().trim().min(1).max(100),
})

export function checkoutConfig() {
  const merchant = process.env.PAYHERE_MERCHANT_ID?.trim()
  const secret = process.env.PAYHERE_MERCHANT_SECRET?.trim()
  const mode = process.env.PAYHERE_MODE
  const shipping = process.env.SHIPPING_LKR
  const site = URL.canParse(process.env.NEXT_PUBLIC_SITE_URL ?? "") ? new URL(process.env.NEXT_PUBLIC_SITE_URL!) : null
  if (!backendConfigured || !merchant || !secret || (mode !== "sandbox" && mode !== "live")
    || !shipping || !/^\d{1,7}$/.test(shipping) || Number(shipping) > 1000000 || !site || site.protocol !== "https:"
    || !site.hostname.includes(".") || site.hostname.endsWith(".localhost") || site.hostname === "127.0.0.1"
    || site.username || site.password || site.pathname !== "/" || site.search || site.hash) return null
  return { merchant, secret, endpoint: payhereEndpoints[mode], mode, origin: site.origin, shipping: Number(shipping) }
}

type Config = NonNullable<ReturnType<typeof checkoutConfig>>
type Customer = Omit<z.infer<typeof checkoutInput>, "ids" | "requestId">
export type CheckoutOrder = { id: string; public_token: string; total_lkr: number }

export function paymentForm(config: Config, customer: Customer, order: CheckoutOrder) {
  const returnPath = "/order/" + order.id + "?key=" + order.public_token
  const amount = asPayHereAmount(order.total_lkr)
  return {
    endpoint: config.endpoint,
    amount: order.total_lkr,
    fields: {
      ...customer,
      country: "Sri Lanka",
      merchant_id: config.merchant,
      return_url: config.origin + returnPath,
      cancel_url: config.origin + returnPath,
      notify_url: config.origin + "/api/payhere/notify",
      order_id: order.id,
      items: "Vault & Vein gemstone order",
      currency: "LKR",
      amount,
      hash: checkoutHash(config.merchant, config.secret, order.id, amount),
    },
  }
}

export async function getOrderStatus(id: string, token: string) {
  const data = await database().order.findUnique({
    where: { id, public_token: token },
    select: { status: true, total_lkr: true, expires_at: true, order_items: { select: { product_id: true } } },
  })
  if (!data) return null
  const status = data.status === "pending" && data.expires_at.getTime() <= Date.now() ? "expired" : data.status
  return { ...data, status }
}

export async function expireCheckouts(db = database()) {
  await db.$queryRaw`SELECT public.expire_checkouts()::text`
}
