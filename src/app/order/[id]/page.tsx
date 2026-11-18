import Link from "next/link"
import { connection } from "next/server"
import { notFound } from "next/navigation"
import { z } from "zod"
import { backendConfigured, serviceDatabase } from "@/lib/backend"
import { CheckoutReceipt } from "@/components/shop/checkout-receipt"
import { formatPrice } from "@/lib/pricing"

export const metadata = {
  title: "Order status",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
}

const statusMessages: Record<string, string> = {
  pending: "We’re waiting for confirmation from PayHere. Refresh this page after completing payment.",
  paid: "Your payment is confirmed.",
  failed: "PayHere reported an unsuccessful payment.",
  cancelled: "PayHere reported that the payment was cancelled.",
  expired: "The reservation has expired. If you’ve already paid, contact us with the order reference below.",
  review: "This payment needs a review. Contact us with the order reference below.",
  shipped: "Your order has shipped.",
}

export default async function OrderPage(props: PageProps<"/order/[id]">) {
  await connection()
  const { id } = await props.params
  const { key } = await props.searchParams
  if (!backendConfigured || !z.uuid().safeParse(id).success || typeof key !== "string" || !z.uuid().safeParse(key).success) notFound()

  const { data: order, error } = await serviceDatabase().from("orders")
    .select("status,total_lkr,expires_at,order_items(product_id)").eq("id", id).eq("public_token", key).maybeSingle()
  if (error) throw new Error("Could not load order status")
  if (!order) notFound()
  const status = order.status === "pending" && Date.parse(order.expires_at) <= Date.now() ? "expired" : order.status
  const paid = status === "paid" || status === "shipped"

  return <div className="wrap section page-top">
    <p className="eyebrow">PayHere checkout</p>
    <h1 className="mt-4">Order status</h1>
    <p className="mt-6 text-lg" role="status">{statusMessages[status]}</p>
    <dl className="my-6 grid gap-2 sm:grid-cols-[8rem_1fr]">
      <dt>Reference</dt><dd className="break-all">{id}</dd>
      <dt>Total</dt><dd>{formatPrice(order.total_lkr, "LKR")}</dd>
    </dl>
    <CheckoutReceipt confirmedIds={paid ? order.order_items.map((item) => item.product_id) : []} refresh={!paid} />
    <Link className="mt-4 inline-flex line-link" href={paid ? "/shop" : "/contact"}>{paid ? "Continue shopping" : "Contact us"}</Link>
  </div>
}
