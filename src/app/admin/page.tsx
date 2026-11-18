import Link from "next/link"
import { requireAdminDatabase } from "@/lib/admin-auth"
import { formatPrice } from "@/lib/pricing"
import { readMessage, setProductVisibility, shipOrder, signOut } from "./actions"

const panels = { inventory: "Inventory", orders: "Orders", inbox: "Inbox" } as const
const results = {
  unavailable: "This change could not be applied. Refresh and check the current record.",
  saved: "Listing saved.",
  shipped: "Order marked as shipped.",
  read: "Message marked as read.",
}
const card = "min-w-0 space-y-3 rounded-2xl border border-emerald/15 p-5"
const date = new Intl.DateTimeFormat("en-LK", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Colombo" })
const pageSize = 20

function value(value: unknown) {
  if (Array.isArray(value)) return value.join(", ")
  return typeof value === "string" ? value.trim() : ""
}

function Details({ record, labels }: { record: Record<string, unknown>; labels: Record<string, string> }) {
  return <dl className="grid gap-2">
    {Object.entries(labels).map(([key, label]) => {
      const text = value(record[key])
      return text && <div key={key} className="grid gap-1 sm:grid-cols-[7rem_minmax(0,1fr)]">
        <dt className="font-semibold">{label}</dt>
        <dd className="whitespace-pre-wrap wrap-anywhere">{text}</dd>
      </div>
    })}
  </dl>
}

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const db = await requireAdminDatabase()
  const query = await searchParams
  const section = query.view === "orders" || query.view === "inbox" ? query.view : "inventory"
  const rawPage = typeof query.page === "string" ? Number(query.page) : 1
  const page = Number.isSafeInteger(rawPage) && rawPage >= 1 && rawPage <= 10000 ? rawPage : 1
  const offset = (page - 1) * pageSize
  const nav = (panel: string, pageNumber = 1) => "/admin?view=" + panel + (pageNumber > 1 ? "&page=" + pageNumber : "")
  const result = typeof query.result === "string" && Object.hasOwn(results, query.result) ? results[query.result as keyof typeof results] : null

  if (section !== "inbox") {
    const { error } = await db.rpc("expire_checkouts")
    if (error) throw new Error("Could not refresh reservations")
  }

  const response = await (section === "inventory"
    ? db.from("products").select("id,slug,name,status,price_lkr,is_published,is_sample").order("name").order("id")
    : section === "orders"
      ? db.from("orders").select("id,status,total_lkr,shipping_lkr,customer,created_at,order_items(name,price_lkr)").order("created_at", { ascending: false }).order("id")
      : db.from("inbox").select("id,kind,email,payload,read_at,created_at").order("created_at", { ascending: false }).order("id")
  ).range(offset, offset + pageSize)
  if (response.error) throw new Error("Could not load store records")
  const rows = response.data.slice(0, pageSize)

  return <section className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h1>Store admin</h1>
      <form action={signOut}><button type="submit" className="pill">Sign out</button></form>
    </div>
    <nav aria-label="Store admin" className="flex flex-wrap gap-2">
      {Object.entries(panels).map(([key, label]) =>
        <Link key={key} className={key === section ? "pill pill-primary" : "pill"} href={nav(key)}
          prefetch={false} aria-current={key === section ? "page" : undefined}>{label}</Link>)}
    </nav>
    {result && <p role="status">{result}</p>}
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h2 className="text-4xl">{panels[section]}</h2>
      {section === "inventory" && <Link href="/admin/products/new" className="pill pill-primary" prefetch={false}>Add listing</Link>}
    </div>
    {rows.length === 0 ? <p>No {section === "inventory" ? "listings" : section === "orders" ? "orders" : "messages"} on this page.</p> :
      <ul className="grid gap-3">
        {rows.map((row) => {
          if ("is_published" in row) return <li key={row.id} className={card}>
            <h3 className="text-3xl">{row.name}</h3>
            <p>{formatPrice(row.price_lkr, "LKR")} · <span className="capitalize">{row.status}</span> · {row.is_published ? "Published" : "Draft"}{row.is_sample ? " · Sample" : ""}</p>
            <div className="flex flex-wrap items-center gap-3">
              {row.status !== "sold" && <Link className="pill" href={"/admin/products/" + row.id} prefetch={false}>Edit listing</Link>}
              {row.is_published && <Link className="pill" href={"/shop/" + row.slug}>View listing</Link>}
              {row.status !== "reserved" && <form action={setProductVisibility.bind(null, row.id, !row.is_published)}>
                <button type="submit" className="pill">{row.is_published ? "Unpublish" : "Publish"}</button>
              </form>}
            </div>
          </li>

          if ("order_items" in row) return <li key={row.id} className={card}>
            <h3 className="text-3xl capitalize">{row.status} order</h3>
            <p className="wrap-anywhere">{row.id} · {date.format(new Date(row.created_at))} · {formatPrice(row.total_lkr, "LKR")}</p>
            <ul className="list-disc pl-5">
              {row.order_items.map(({ name, price_lkr }, i) => <li key={i}>{name} · {formatPrice(price_lkr, "LKR")}</li>)}
              <li>Delivery · {formatPrice(row.shipping_lkr, "LKR")}</li>
            </ul>
            <Details record={row.customer} labels={{ first_name: "First name", last_name: "Last name", email: "Email", phone: "Phone", address: "Address", city: "City" }} />
            {row.status === "paid" && <form action={shipOrder.bind(null, row.id)}>
              <button type="submit" className="pill">Mark as shipped</button>
            </form>}
          </li>

          return <li key={row.id} className={card}>
            <h3 className="text-3xl capitalize">{row.kind}{row.read_at ? "" : " · Unread"}</h3>
            <p>{date.format(new Date(row.created_at))}</p>
            <Details record={row.payload} labels={{ name: "Name", email: "Email", subject: "Subject", message: "Message", mobile: "Mobile", gem: "Gem", budget: "Budget", colour: "Colour", size: "Size", notes: "Notes", stones: "Stones" }} />
            {!row.read_at && <form action={readMessage.bind(null, row.id)}>
              <button type="submit" className="pill">Mark as read</button>
            </form>}
          </li>
        })}
      </ul>}
    {(page > 1 || response.data.length > pageSize) && <nav className="flex gap-3" aria-label="Admin result pages">
      {page > 1 && <Link className="pill" href={nav(section, page - 1)} prefetch={false}>Previous page</Link>}
      {page < 10000 && response.data.length > pageSize && <Link className="pill" href={nav(section, page + 1)} prefetch={false}>Next page</Link>}
    </nav>}
  </section>
}
