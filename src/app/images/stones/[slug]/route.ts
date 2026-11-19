import { getStoneBySlug } from "@/lib/data"
import { gemSvg } from "@/components/three/gem-shape"
import { productPhotoUrl } from "@/lib/product-photo"

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const stone = await getStoneBySlug(slug)
  if (!stone) return new Response(null, { status: 404 })
  const photo = productPhotoUrl(stone.image_url, 1200)
  if (photo) return Response.redirect(photo, 307)
  return new Response(gemSvg(stone.model_key, stone.tint), {
    headers: { "Content-Type": "image/svg+xml; charset=utf-8", "X-Content-Type-Options": "nosniff" },
  })
}
