import { createHash, timingSafeEqual } from "node:crypto"

export const payhereEndpoints = {
  sandbox: "https://sandbox.payhere.lk/pay/checkout",
  live: "https://www.payhere.lk/pay/checkout",
} as const

function md5(value: string) {
  return createHash("md5").update(value, "utf8").digest("hex").toUpperCase()
}

export function asPayHereAmount(lkr: number) {
  return lkr.toFixed(2)
}

export function checkoutHash(merchant: string, secret: string, order: string, amount: string) {
  return md5(merchant + order + amount + "LKR" + md5(secret))
}

export function notification(form: URLSearchParams, merchant: string, secret: string) {
  const fields = ["merchant_id", "order_id", "payment_id", "payhere_amount", "payhere_currency", "status_code", "md5sig"]
  if (fields.some((field) => form.getAll(field).length !== 1)) return null
  const order = form.get("order_id")!
  const payment = form.get("payment_id")!
  const amount = form.get("payhere_amount")!
  const currency = form.get("payhere_currency")!
  const status = form.get("status_code")!
  const signature = form.get("md5sig")!
  if (form.get("merchant_id") !== merchant || currency !== "LKR" || !["2", "0", "-1", "-2", "-3"].includes(status)
    || !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(order)
    || !/^[A-Za-z0-9_-]{1,100}$/.test(payment) || !/^\d{1,10}\.\d{2}$/.test(amount)
    || !/^[A-Fa-f0-9]{32}$/.test(signature)) return null

  const expected = md5(merchant + order + amount + currency + status + md5(secret))
  if (!timingSafeEqual(Buffer.from(signature.toUpperCase(), "hex"), Buffer.from(expected, "hex"))) return null
  return { order, payment, amount: Number(amount), status }
}
