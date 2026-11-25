import Link from "next/link"
import { connection } from "next/server"
import { AdminHistory } from "./admin-history"
import "./admin.css"

export const metadata = { title: "Store admin", robots: { index: false, follow: false } }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await connection()
  return <div className="admin-shell">
    <AdminHistory />
    <a href="#main" className="admin-skip">Skip to content</a>
    <header className="admin-masthead">
      <div className="admin-wrap">
        <Link href="/vault8@vein@8" className="admin-brand">Vault &amp; Vein <span>Administration</span></Link>
        <form action="/vault8@vein@8/lock" method="post">
          <button className="admin-store-link">View storefront</button>
        </form>
      </div>
    </header>
    <main id="main" tabIndex={-1} className="admin-wrap admin-main">{children}</main>
  </div>
}
