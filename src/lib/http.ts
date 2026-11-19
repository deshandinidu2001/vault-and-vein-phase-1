import { createHash } from "node:crypto"
import { serviceDatabase } from "./backend"

// Cache only the absence of the newer RPC, never a caller's quota decision.
let retryCombinedLimitAfter = 0

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
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") return null
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
  const hash = (value: string) => createHash("sha256").update(scope + ":" + value).digest("hex")
  const source = hash("source:" + (ip || "shared"))
  const identity = hash("email:" + email.toLowerCase())
  const max = ip ? 30 : 120
  if (Date.now() >= retryCombinedLimitAfter) {
    const combined = await db.rpc("permit_store_request", { p_source: source, p_identity: identity, p_source_max: max })
    if (!combined.error) return combined.data === true
    if (!["PGRST202", "42883"].includes(combined.error.code)) throw combined.error
    retryCombinedLimitAfter = Date.now() + 60_000
  }
  async function consume(key: string, max: number) {
    const { data, error } = await db.rpc("consume_rate_limit", { p_key: key, p_max: max, p_seconds: 600 })
    if (error) throw error
    return data === true
  }
  return await consume(source, max) && await consume(identity, 6)
}
