import { randomBytes, scrypt, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"

const derive = promisify(scrypt)
const options = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 }

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex")
  const key = await derive(password, salt, 64, options)
  return salt + ":" + key.toString("hex")
}

export async function verifyPassword(password, encoded) {
  // Do the same work for an unknown account to avoid a sign-in timing difference.
  const valid = typeof encoded === "string" && /^[0-9a-f]{32}:[0-9a-f]{128}$/.test(encoded)
  const [salt, stored] = valid ? encoded.split(":") : ["0".repeat(32), "0".repeat(128)]
  const key = await derive(password, salt, 64, options)
  return timingSafeEqual(key, Buffer.from(stored, "hex")) && valid
}
