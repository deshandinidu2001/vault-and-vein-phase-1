import { createHash } from "node:crypto"
import { serviceDatabase } from "./backend"

export async function readBody(request: Request, limit = 8192) {
  if (Number(request.headers.get("content-length")) > limit || !request.body) return null
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let length = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) return Buffer.concat(chunks).toString("utf8")
    length += value.length
    if (length > limit) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }
}

export async function readJson(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return null
  try {
    const payload = await readBody(request)
    return payload === null ? null : JSON.parse(payload) as unknown
  } catch {
    return null
  }
}

export async function permitRequest(request: Request, scope: string, email: string) {
  // Vercel supplies this header at ingress. Other hosts use a bounded shared bucket.
  const ip = process.env.VERCEL ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() : null
  const db = serviceDatabase()
  async function consume(value: string, max: number) {
    const key = createHash("sha256").update(scope + ":" + value).digest("hex")
    const { data, error } = await db.rpc("consume_rate_limit", { p_key: key, p_max: max, p_seconds: 600 })
    if (error) throw error
    return data === true
  }
  return await consume("source:" + (ip || "shared"), ip ? 30 : 120) && await consume("email:" + email.toLowerCase(), 6)
}
