export const productPhotoIdPrefix = "vault-and-vein/products/"
const photoPath = /^(https:\/\/res\.cloudinary\.com\/[\w-]+\/image\/upload\/)(v\d+\/(vault-and-vein\/products\/[a-f0-9-]{36})\.(?:jpg|jpeg|png|webp))$/

export function parseProductPhoto(url: string | null | undefined) {
  return url ? photoPath.exec(url) : null
}

export function productPhotoUrl(url: string | null | undefined, width: number) {
  const photo = parseProductPhoto(url)
  return photo ? photo[1] + "c_limit,w_" + width + ",f_auto,q_auto/" + photo[2] : null
}
