import Link from "next/link"
import { connection } from "next/server"
import "./admin.css"

export const metadata = { title: "Store admin", robots: { index: false, follow: false } }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await connection()
  return <div className="admin-shell">
    <a href="#main" className="admin-skip">Skip to content</a>
    <header className="admin-masthead">
      <div className="admin-wrap">
        <Link href="/admin" className="admin-brand">Vault &amp; Vein <span>Administration</span></Link>
        {/* A full navigation installs the storefront's own document security policy. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className="admin-store-link">View storefront</a>
      </div>
    </header>
    <main id="main" tabIndex={-1} className="admin-wrap admin-main">{children}</main>
  </div>
}
