import Link from "next/link"

export default function AdminNotFound() {
  return <section className="admin-panel grid justify-items-start gap-4 p-6">
    <h1>Listing unavailable</h1>
    <p>This listing may have been removed from inventory.</p>
    <Link className="admin-button" href="/admin">Back to inventory</Link>
  </section>
}
