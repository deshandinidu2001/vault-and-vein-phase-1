import { getStoneBySlug } from "@/lib/data"
import { gemSvg } from "@/components/three/gem-shape"

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const stone = await getStoneBySlug(slug)
  if (!stone) return new Response(null, { status: 404 })
  return new Response(gemSvg(stone.cut, stone.tint), {
    headers: { "Content-Type": "image/svg+xml; charset=utf-8", "X-Content-Type-Options": "nosniff" },
  })
}
