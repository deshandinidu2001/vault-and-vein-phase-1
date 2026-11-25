import "server-only"
import { createHmac, randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto"
import { database } from "./backend"

export const storeAdminEmail = "vault8vein@gmail.com"
export const adminPinPattern = /^\d{8,12}$/

function derivePin(pin: string, salt: Buffer): Promise<Buffer> {
  const secret = process.env.NEON_AUTH_COOKIE_SECRET
  if (!secret || secret.length < 32) throw new Error("Admin cookie secret is missing")
  const input = createHmac("sha256", secret).update("store-admin-pin\0" + pin).digest()
  return new Promise((resolve, reject) => {
    scrypt(input, salt, 32, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 }, (error, key) => {
      if (error) reject(error)
      else resolve(key)
    })
  })
}

export async function adminPinRevision() {
  const pin = await database().storeAdminPin.findUnique({
    where: { email: storeAdminEmail }, select: { revision: true },
  })
  return pin?.revision ?? null
}

export async function matchAdminPin(pin: string, revision: string) {
  const record = await database().storeAdminPin.findUnique({
    where: { email: storeAdminEmail, revision }, select: { pin_hash: true },
  })
  const parts = /^([\da-f]{32}):([\da-f]{64})$/.exec(record?.pin_hash ?? "")
  return parts !== null && timingSafeEqual(
    Buffer.from(parts[2], "hex"), await derivePin(pin, Buffer.from(parts[1], "hex")),
  )
}

export async function saveAdminPin(pin: string, previousRevision: string | null) {
  const salt = randomBytes(16)
  const pin_hash = salt.toString("hex") + ":" + (await derivePin(pin, salt)).toString("hex")
  const revision = randomUUID()
  const db = database()
  const result = previousRevision
    ? await db.storeAdminPin.updateMany({
      where: { email: storeAdminEmail, revision: previousRevision }, data: { pin_hash, revision },
    })
    : await db.storeAdminPin.createMany({
      data: { email: storeAdminEmail, pin_hash, revision }, skipDuplicates: true,
    })
  return result.count === 1 ? revision : null
}
