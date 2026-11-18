import { CartHydration } from "./cart-hydration"
import { CartSheet } from "./cart-sheet"
import { EnquirySheet } from "./enquiry-sheet"
import { SiteFooter } from "./site-footer"
import { SiteHeader } from "./site-header"
import { Toaster } from "sonner"

export function SiteShell({ children }: { children: React.ReactNode }) {
  return <><CartHydration /><SiteHeader />{children}<SiteFooter /><CartSheet /><EnquirySheet /><Toaster theme="light" position="bottom-center" /></>
}
