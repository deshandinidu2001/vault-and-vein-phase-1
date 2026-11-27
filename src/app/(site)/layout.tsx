import { MotionProvider } from "@/components/animation/motion-provider"
import { SiteShell } from "@/components/layout/site-shell"

import { connection } from "next/server"

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  await connection()
  return <MotionProvider><SiteShell>{children}</SiteShell></MotionProvider>
}
