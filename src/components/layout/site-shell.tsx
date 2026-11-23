import { CartHydration } from "./cart-hydration"
import { Suspense } from "react"
import { StoreOverlays } from "./store-overlays"
import { SiteFooter } from "./site-footer"
import { SiteHeader } from "./site-header"
import { Toaster } from "sonner"
import { checkoutConfig } from "@/lib/checkout"
import { getGemCategories } from "@/lib/gem-categories"
import { gemLinks } from "@/config/site"
import { CatalogueUnavailableError } from "@/lib/backend"

async function Footer() {
  const result = await getGemCategories().catch(error => {
    if (!(error instanceof CatalogueUnavailableError)) throw error
    console.warn("Footer category links are temporarily unavailable.")
    return null
  })
  if (!result) return <SiteFooter shopLinks={[{ href: "/shop", label: "Browse the shop" }]} />
  const shown = new Set(result.categories.map(({ slug }) => slug))
  return <SiteFooter shopLinks={gemLinks.filter(({ category }) => !category || shown.has(category))} />
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
