import Link from "next/link"

export default function SiteNotFound() {
  return <section className="wrap section page-top grid min-h-[60vh] content-center justify-items-start gap-6">
    <p className="eyebrow text-[#785520]">404 / Page not found</p>
    <h1>This page has moved or is missing.</h1>
    <p>You can return to the home page or explore the catalogue.</p>
    <div className="flex flex-wrap gap-3"><Link className="pill pill-primary" href="/">Return home</Link><Link className="pill" href="/shop">Explore the shop</Link></div>
  </section>
}
