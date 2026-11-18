import { Cormorant_Garamond, Inter } from "next/font/google"
import { MotionProvider } from "@/components/animation/motion-provider"
import { SiteShell } from "@/components/layout/site-shell"
import "./globals.css"

const display = Cormorant_Garamond({ subsets: ["latin"], variable: "--type-display", display: "swap" })
const sans = Inter({ subsets: ["latin"], variable: "--type-sans", display: "swap" })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={display.variable + " " + sans.variable}>
      <body><MotionProvider><SiteShell>{children}</SiteShell></MotionProvider></body>
    </html>
  )
}
