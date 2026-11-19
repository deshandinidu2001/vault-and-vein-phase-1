import { MotionProvider } from "@/components/animation/motion-provider"
import { SiteShell } from "@/components/layout/site-shell"

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return <MotionProvider><SiteShell>{children}</SiteShell></MotionProvider>
}
