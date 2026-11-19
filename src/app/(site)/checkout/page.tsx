import Link from "next/link"
import { CheckoutForm } from "@/components/shop/checkout-form"
import { checkoutConfig } from "@/lib/checkout"

export const metadata = { title: "Checkout", robots: { index: false, follow: false } }

export default async function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  const config = checkoutConfig()
  const { item } = await searchParams
  const itemId = typeof item === "string" ? item : undefined
  return <div className="wrap section page-top-compact">
    <p className="eyebrow">Your order</p>
    <h1 className="mt-4">Checkout</h1>
    {config ? <CheckoutForm key={itemId ?? "cart"} itemId={itemId} shipping={config.shipping} sandbox={config.mode === "sandbox"} /> : (
      <div className="mt-6 space-y-5">
        <p>Online payment is currently unavailable. Enquire about your shortlist to discuss a stone.</p>
        <Link className="pill pill-primary" href="/shop">Back to the shop</Link>
      </div>
    )}
  </div>
}
