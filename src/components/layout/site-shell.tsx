import { CartHydration } from "./cart-hydration"
import { Suspense } from "react"
import { StoreOverlays } from "./store-overlays"
import { SiteFooter } from "./site-footer"
import { SiteHeader } from "./site-header"
import { Toaster } from "sonner"
import { checkoutConfig } from "@/lib/checkout"
import { getGemCategories } from "@/lib/gem-categories"
import { gemLinks } from "@/config/site"

async function Footer() {
  const { categories } = await getGemCategories()
  const shown = new Set(categories.map(({ slug }) => slug))
  const shopLinks = gemLinks.filter(({ category }) => !category || shown.has(category))
  return <SiteFooter shopLinks={shopLinks} />
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  return <>
    <CartHydration />
    <SiteHeader />
    <div className="site-frame">
      <div className="site-page-surface">{children}</div>
      <Suspense fallback={null}><Footer /></Suspense>
    </div>
    <StoreOverlays paymentsEnabled={Boolean(checkoutConfig())} />
    <Toaster theme="light" position="bottom-center" />
  </>
}
