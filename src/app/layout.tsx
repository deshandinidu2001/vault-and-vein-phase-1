import type { Metadata, Viewport } from "next"
import { site } from "@/config/site"
import { Cormorant_Garamond, Inter } from "next/font/google"
import { MotionProvider } from "@/components/animation/motion-provider"
import { SiteShell } from "@/components/layout/site-shell"
import "./globals.css"

const display = Cormorant_Garamond({ subsets: ["latin"], variable: "--type-display", display: "swap" })
const sans = Inter({ subsets: ["latin"], variable: "--type-sans", display: "swap" })

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: "%s | " + site.name },
  description: site.description,
  applicationName: site.name,
  openGraph: { title: site.name, description: site.description, siteName: site.name, type: "website", url: "/" },
  twitter: { card: "summary_large_image" },
}

export const viewport: Viewport = { themeColor: "#f6f1e7" }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={display.variable + " " + sans.variable}>
      <body><MotionProvider><SiteShell>{children}</SiteShell></MotionProvider></body>
    </html>
  )
}
