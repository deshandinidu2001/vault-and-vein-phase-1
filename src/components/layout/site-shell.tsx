import { CartHydration } from "./cart-hydration"
import { CartSheet } from "./cart-sheet"
import { EnquirySheet } from "./enquiry-sheet"
import { SiteFooter } from "./site-footer"
import { SiteHeader } from "./site-header"
import { Toaster } from "sonner"

export function SiteShell({ children }: { children: React.ReactNode }) {
  return <>
    <CartHydration />
    <SiteHeader />
    <div className="site-frame">
      <div className="site-page-surface">{children}</div>
      <SiteFooter />
    </div>
    <CartSheet />
    <EnquirySheet />
    <Toaster theme="light" position="bottom-center" />
  </>
}
