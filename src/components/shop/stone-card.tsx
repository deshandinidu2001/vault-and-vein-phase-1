import { NavigationLink } from "@/components/layout/navigation-link"
import { ArrowUpRight } from "lucide-react"
import { StoneMedia } from "@/components/product/stone-media"
import { stoneCategory, type Stone } from "@/types/stone"
import { StonePrice } from "./stone-price"

export function StoneCard({ stone }: { stone: Stone }) {
  return (
    <article className="stone-card h-full">
      <NavigationLink href={"/shop/" + stone.slug} className="flex h-full flex-col focus-visible:outline-offset-[-4px]">
        <div className="stone-art">
          <StoneMedia stone={stone} label={"Photo of " + stone.name}
            sizes="(min-width: 1600px) 368px, (min-width: 1280px) 24vw, (min-width: 1024px) 32vw, (min-width: 640px) 47vw, 95vw" />
          {stone.status !== "available" && <span className="absolute left-3 top-3 rounded-full bg-cream px-3 py-1 text-xs capitalize">{stone.status}</span>}
        </div>
        <div className="flex grow flex-col items-start gap-2 px-4 pt-4 md:px-5 md:pt-5">
          <p className="text-sm font-semibold text-[#785520]">{stoneCategory(stone)}</p>
          <h3 className="wrap-anywhere text-[clamp(1.7rem,2.8vw,2.2rem)]">{stone.name}</h3>
          <p className="mb-3 wrap-anywhere text-sm text-muted-foreground">{stone.cut} · {stone.carat} ct · {stone.colour}</p>
          <div className="stone-card-price mt-auto flex w-full items-center justify-between gap-2 border-t border-emerald/15 py-3 font-semibold text-emerald">
            <StonePrice lkr={stone.price_lkr} />
            <span className="stone-card-arrow" aria-hidden="true"><ArrowUpRight size={18} /></span>
          </div>
        </div>
      </NavigationLink>
    </article>
  )
}
