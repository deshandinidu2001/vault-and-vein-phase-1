import "server-only"
import { randomUUID } from "node:crypto"
import { parseProductPhoto, productPhotoIdPrefix } from "./product-photo"

const maxPhotoBytes = 3 * 1024 * 1024

function cloudinaryConfig() {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME?.trim()
  const key = process.env.CLOUDINARY_API_KEY?.trim()
  const secret = process.env.CLOUDINARY_API_SECRET?.trim()
  return cloud && /^[\w-]+$/.test(cloud) && key && secret ? { cloud, key, secret } : null
}

export function cloudinaryConfigured() {
  return Boolean(cloudinaryConfig())
}

type CloudinaryConfig = NonNullable<ReturnType<typeof cloudinaryConfig>>

async function sendImageRequest(config: CloudinaryConfig, action: "upload" | "destroy", form: FormData) {
  return fetch("https://api.cloudinary.com/v1_1/" + config.cloud + "/image/" + action, {
    method: "POST",
    headers: { Authorization: "Basic " + Buffer.from(config.key + ":" + config.secret).toString("base64") },
    body: form,
    signal: AbortSignal.timeout(15_000),
    redirect: "error",
  })
}

export async function uploadProductPhoto(file: File) {
  const config = cloudinaryConfig()
  if (!config) return { error: "photo-config" } as const
  if (file.size > maxPhotoBytes) return { error: "photo-invalid" } as const

  const prefix = Buffer.from(await file.slice(0, 12).arrayBuffer())
  const jpeg = file.type === "image/jpeg" && prefix.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
  const png = file.type === "image/png" && prefix.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  const webp = file.type === "image/webp" && prefix.toString("ascii", 0, 4) === "RIFF" && prefix.toString("ascii", 8, 12) === "WEBP"
  if (!jpeg && !png && !webp) return { error: "photo-invalid" } as const

  const publicId = productPhotoIdPrefix + randomUUID()
  const form = new FormData()
  form.set("file", file, "product-photo")
  form.set("public_id", publicId)
  form.set("overwrite", "false")
  form.set("allowed_formats", "jpg,jpeg,png,webp")
  form.set("transformation", "c_limit,w_2000,h_2000")

  try {
    const response = await sendImageRequest(config, "upload", form)
    if (response.ok) {
      const { public_id, secure_url } = await response.json()
      const photo = typeof secure_url === "string" ? parseProductPhoto(secure_url) : null
      if (public_id === publicId && photo?.[3] === publicId && photo[1].startsWith("https://res.cloudinary.com/" + config.cloud + "/")) {
        return { url: secure_url as string } as const
      }
    }
  } catch {
    // No upstream response body or credential details are shown to the browser.
  }
  return { error: "photo-failed" } as const
}

export async function discardProductPhoto(url: string) {
  const config = cloudinaryConfig()
  const photo = parseProductPhoto(url)
  if (!config || !photo || !photo[1].startsWith("https://res.cloudinary.com/" + config.cloud + "/")) return
  const form = new FormData()
  form.set("public_id", photo[3])
  form.set("invalidate", "true")
  try {
    const response = await sendImageRequest(config, "destroy", form)
    if (!response.ok) console.warn("Unable to remove an unused Cloudinary product photo.")
  } catch {
    console.warn("Unable to remove an unused Cloudinary product photo.")
  }
}
