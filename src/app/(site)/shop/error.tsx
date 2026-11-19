"use client"

import Link from "next/link"

export default function ShopError({ reset }: { reset: () => void }) {
  return <section className="wrap page-top section grid justify-items-start gap-5" role="alert">
    <p className="eyebrow">Catalogue</p>
    <h1>We couldn’t load the stones.</h1>
    <p>Try loading the catalogue again or return to the home page.</p>
    <div className="flex flex-wrap gap-3">
      <button type="button" className="pill pill-primary" onClick={reset}>Try again</button>
      <Link className="pill" href="/">Return home</Link>
    </div>
  </section>
}
