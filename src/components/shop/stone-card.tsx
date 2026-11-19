import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { GemArt } from "@/components/three/gem-art"
import { stoneCategory, type Stone } from "@/types/stone"
import { StonePrice } from "./stone-price"

export function StoneCard({ stone }: { stone: Stone }) {
  return (
    <article className="stone-card h-full">
      <Link href={"/shop/" + stone.slug} className="block h-full focus-visible:outline-offset-[-4px]">
        <div className="stone-art">
          <GemArt cut={stone.cut} tint={stone.tint} label={"Illustration of " + stone.name} sizes="(min-width: 1280px) 29vw, (min-width: 640px) 47vw, 95vw" />
          {stone.status !== "available" && <span className="absolute left-3 top-3 rounded-full bg-cream px-3 py-1 text-xs capitalize">{stone.status}</span>}
        </div>
        <div className="grid gap-2 p-4 md:p-5">
          <p className="eyebrow text-[#785520]">{stoneCategory(stone)}</p>
          <h3 className="text-[clamp(1.7rem,2.8vw,2.2rem)]">{stone.name}</h3>
          <p className="text-sm text-muted-foreground">{stone.cut} · {stone.carat} ct · {stone.colour}</p>
          <div className="mt-2 flex items-center justify-between gap-2 font-semibold text-emerald">
            <StonePrice lkr={stone.price_lkr} />
            <ArrowUpRight aria-hidden="true" size={20} />
          </div>
        </div>
      </Link>
    </article>
  )
}
