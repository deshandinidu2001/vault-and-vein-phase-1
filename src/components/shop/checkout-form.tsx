"use client"

import Link from "next/link"
import { useRef, useState, type FormEvent } from "react"
import { useCart } from "@/store/cart"
import { formatPrice } from "@/lib/pricing"

type Prepared = {
  endpoint: string
  amount: number
  fields: Record<string, string>
}
const details = [
  { name: "first_name", label: "First name", autoComplete: "given-name", maxLength: 80 },
  { name: "last_name", label: "Last name", autoComplete: "family-name", maxLength: 80 },
  { name: "email", label: "Email", autoComplete: "email", maxLength: 254, type: "email" },
  { name: "phone", label: "Phone", autoComplete: "tel", maxLength: 24, minLength: 7, type: "tel" },
  { name: "address", label: "Street address", autoComplete: "street-address", maxLength: 200, minLength: 5 },
  { name: "city", label: "City", autoComplete: "address-level2", maxLength: 100 },
]

export function CheckoutForm({ shipping, sandbox, itemId }: { shipping: number; sandbox: boolean; itemId?: string }) {
  const cart = useCart((state) => state.items)
  const items = cart.filter(({ id, is_sample }) => is_sample === false && (itemId === undefined || id === itemId))
  const [prepared, setPrepared] = useState<Prepared>()
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const attempt = useRef<{ details: string; id: string }>(null)
  const estimate = items.reduce((sum, item) => sum + item.price_lkr, shipping)

  async function reserve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const customer = Object.fromEntries(new FormData(event.currentTarget))
    const order = { ...customer, ids: items.map((item) => item.id).sort() }
    const details = JSON.stringify(order)
    if (attempt.current?.details !== details) attempt.current = { details, id: crypto.randomUUID() }
    setError("")
    setBusy(true)
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...order, requestId: attempt.current.id }),
      })
      const result = await response.json()
      if (!response.ok) {
        if (response.status === 409) attempt.current = null
        setError(result.message)
        return
      }
      setPrepared(result)
    } catch {
      setError("The request did not complete. Check your connection and try again.")
    } finally {
      setBusy(false)
    }
  }

  if (prepared) {
    return <div className="mt-8 max-w-lg space-y-5">
      <h2 tabIndex={-1} ref={(node) => { node?.focus() }} className="font-display text-4xl">Your stones are reserved</h2>
      <p>Your reservation lasts 20 minutes. The confirmed total is <strong>{formatPrice(prepared.amount, "LKR")}</strong>.</p>
      <form method="post" action={prepared.endpoint}>
        {Object.entries(prepared.fields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
        <button className="pill pill-primary" type="submit">Continue to {sandbox ? "PayHere sandbox" : "PayHere"}</button>
      </form>
      <a href={new URL(prepared.fields.return_url).pathname + new URL(prepared.fields.return_url).search} className="line-link">View order status</a>
    </div>
  }

  if (!items.length || items.length > 12) {
    return <div className="mt-6 space-y-5">
      <p>Choose up to 12 available catalogue stones for checkout. You can ask about sample stones from your cart.</p>
      <Link className="pill pill-primary" href="/shop">Back to the shop</Link>
    </div>
  }

  return <form className="mt-8 grid max-w-2xl gap-5" onSubmit={reserve}>
    <p>{sandbox ? "PayHere sandbox checkout. Use test payment details. " : ""}Delivery within Sri Lanka.</p>
    <div className="grid gap-4 sm:grid-cols-2">
      {details.map(({ name, label, autoComplete, type = "text", ...limits }) => (
        <label key={name} className="grid gap-2 text-sm font-semibold">
          {label}
          <input className="min-h-11 rounded-lg border border-input bg-background px-3 font-normal" name={name} type={type}
            autoComplete={autoComplete} required {...limits} />
        </label>
      ))}
    </div>
    <dl className="grid grid-cols-[1fr_auto] gap-2 border-t border-border pt-4">
      {items.map((item) => <div key={item.id} className="contents"><dt>{item.name}</dt><dd>{formatPrice(item.price_lkr, "LKR")}</dd></div>)}
      <dt>Delivery</dt><dd>{formatPrice(shipping, "LKR")}</dd>
      <dt className="font-semibold">Estimated total</dt><dd className="font-semibold">{formatPrice(estimate, "LKR")}</dd>
    </dl>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <button className="pill pill-primary w-fit" type="submit" disabled={busy}>{busy ? "Reserving…" : "Reserve for payment"}</button>
  </form>
}
