import { createHash } from "node:crypto"
import { database } from "./backend"

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
  const hash = (value: string) => createHash("sha256").update(scope + ":" + value).digest("hex")
  const source = hash("source:" + (ip || "shared"))
  const identity = hash("email:" + email.toLowerCase())
  const max = ip ? 30 : 120
  const [result] = await database().$queryRaw<{ allowed: boolean }[]>`
    SELECT public.permit_store_request(${source}, ${identity}, ${max}::integer) AS allowed
  `
  return result?.allowed === true
}
