import Link from "next/link"
import "./admin.css"

export const metadata = { title: "Store admin", robots: { index: false, follow: false } }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-shell">
    <a href="#main" className="admin-skip">Skip to content</a>
    <header className="admin-masthead">
      <div className="admin-wrap">
        <Link href="/admin" className="admin-brand">Vault &amp; Vein <span>Administration</span></Link>
        <Link href="/" className="admin-store-link">View storefront</Link>
      </div>
    </header>
    <main id="main" tabIndex={-1} className="admin-wrap admin-main">{children}</main>
  </div>
}
