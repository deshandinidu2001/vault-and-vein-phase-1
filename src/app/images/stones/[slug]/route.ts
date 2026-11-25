import { getStoneBySlug } from "@/lib/data"
import { productPhotoUrl } from "@/lib/product-photo"

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const stone = await getStoneBySlug(slug)
  if (!stone) return new Response(null, { status: 404 })
  const photo = productPhotoUrl(stone.image_url, 1200)
  return photo ? Response.redirect(photo, 307) : new Response(null, { status: 404 })
}
