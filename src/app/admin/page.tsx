import Link from "next/link"
import { requireAdminDatabase } from "@/lib/admin-auth"
import { formatPrice } from "@/lib/pricing"
import { getGemCategories } from "@/lib/gem-categories"
import { checkoutConfig } from "@/lib/checkout"
import { deleteProduct, readMessage, setProductVisibility, shipOrder, signOut } from "./actions"
import { AdminCategories } from "./categories"

const panels = { inventory: "Inventory", categories: "Categories", orders: "Orders", inbox: "Inbox" } as const
const stockFilters = ["available", "reserved", "sold"] as const
const results = {
  unavailable: "This change could not be applied. Refresh and check the current record.",
  saved: "Listing saved.",
  shipped: "Order marked as shipped.",
  read: "Message marked as read.",
  deleted: "Listing removed from the shop and inventory.",
  migration: "Apply the inventory management migration to enable this action.",
  "category-saved": "Category saved.",
  "category-deleted": "Category deleted.",
  "category-invalid": "Enter a name and a valid URL slug.",
  "category-duplicate": "This name or URL slug already exists.",
  "category-in-use": "This category is assigned to a listing and cannot be deleted.",
}
const card = "admin-panel min-w-0 space-y-3 p-5"
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
  const section = query.view === "orders" || query.view === "inbox" || query.view === "categories" ? query.view : "inventory"
  const status = stockFilters.find((option) => query.status === option)
  const rawPage = typeof query.page === "string" ? Number(query.page) : 1
  const page = Number.isSafeInteger(rawPage) && rawPage >= 1 && rawPage <= 10000 ? rawPage : 1
  const offset = (page - 1) * pageSize
  function nav(panel: string, pageNumber = 1, filter?: string) {
    const params = new URLSearchParams({ view: panel })
    if (pageNumber > 1) params.set("page", String(pageNumber))
    if (panel === "inventory" && filter) params.set("status", filter)
    return "/admin?" + params
  }
  const result = typeof query.result === "string" && Object.hasOwn(results, query.result) ? results[query.result as keyof typeof results] : null

  const { categories, editable } = await getGemCategories()
  const categoryNames = new Map(categories.map(({ slug, name }) => [slug, name]))
  if (section === "inventory" || section === "orders") {
    const { error } = await db.rpc("expire_checkouts")
    if (error) throw new Error("Could not refresh reservations")
  }

  const products = db.from("products").select("id,slug,name,gem_type,status,price_lkr,is_published,is_sample").order("name").order("id")
  if (editable) products.is("archived_at", null)
  if (status) products.eq("status", status)
  const response = section === "categories" ? { data: [], error: null } : await (section === "inventory"
    ? products
    : section === "orders"
      ? db.from("orders").select("id,status,total_lkr,shipping_lkr,customer,created_at,order_items(name,price_lkr)").order("created_at", { ascending: false }).order("id")
      : db.from("inbox").select("id,kind,email,payload,read_at,created_at").order("created_at", { ascending: false }).order("id")
  ).range(offset, offset + pageSize)
  if (response.error) throw new Error("Could not load store records")
  const rows = response.data.slice(0, pageSize)

  return <div className="admin-workspace">
    <div className="admin-titlebar">
      <h1>Store admin</h1>
      <form action={signOut}><button type="submit" className="admin-button">Sign out</button></form>
    </div>
    <nav aria-label="Store admin" className="admin-sidebar">
      {Object.entries(panels).map(([key, label]) =>
        <Link key={key} href={nav(key)}
          prefetch={false} aria-current={key === section ? "page" : undefined}>{label}</Link>)}
    </nav>
    <section className="admin-content space-y-5" aria-labelledby="admin-panel-heading">
    {result && <p className="admin-notice" role="status">{result}</p>}
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h2 id="admin-panel-heading">{panels[section]}</h2>
      {section === "inventory" && <Link href="/admin/products/new" className="admin-button admin-button-primary" prefetch={false}>Add listing</Link>}
    </div>
    {section === "inventory" && <nav aria-label="Stock status" className="admin-filters">
      {[undefined, ...stockFilters].map((filter) => <Link key={filter ?? "all"} href={nav(section, 1, filter)}
        aria-current={status === filter ? "page" : undefined}>{filter ?? "All listings"}</Link>)}
    </nav>}
    {section === "orders" && !checkoutConfig() && <p className="admin-notice">Online checkout is off. Configure PayHere and a public HTTPS site URL to accept payments.</p>}
    {section === "categories" ? editable
      ? <AdminCategories categories={categories} />
      : <p className="admin-notice">Apply the inventory management migration to manage categories.</p>
      : rows.length === 0 ? <p className="admin-panel p-5">No {section === "inventory" ? "listings" : section === "orders" ? "orders" : "messages"} on this page.</p> :
      <ul className="admin-ledger">
        {rows.map((row) => {
          if ("is_published" in row) return <li key={row.id} className="admin-inventory-row admin-panel">
            <div className="min-w-0">
              <h3 className="wrap-anywhere">{row.name}</h3>
              <p className="admin-muted wrap-anywhere text-sm">{categoryNames.get(row.gem_type) ?? row.gem_type}{row.is_sample && " · Sample"}</p>
            </div>
            <div className="admin-stock">
              <p className="font-semibold tabular-nums">{formatPrice(row.price_lkr, "LKR")}</p>
              <p className="admin-muted text-sm"><span className="admin-stock-status" data-status={row.status}>{row.status}</span> · {row.is_published ? "Published" : "Draft"}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {row.status === "available" && <Link className="admin-button" href={"/admin/products/" + row.id} prefetch={false}>Edit listing</Link>}
              {row.status !== "reserved" && <form action={setProductVisibility.bind(null, row.id, !row.is_published)}>
                <button type="submit" className="admin-button">{row.is_published ? "Unpublish" : "Publish"}</button>
              </form>}
              {row.is_published && <Link className="admin-text-link" href={"/shop/" + row.slug}>View listing</Link>}
            </div>
            {editable && row.status === "available" && <details className="admin-delete">
              <summary>Delete listing</summary>
              <form action={deleteProduct.bind(null, row.id)} className="mt-3 grid gap-2">
                <p>Remove {row.name} from the shop and inventory. Existing order records are kept.</p>
                <button type="submit" className="admin-button admin-button-danger w-fit">Confirm delete</button>
              </form>
            </details>}
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
              <button type="submit" className="admin-button">Mark as shipped</button>
            </form>}
          </li>

          return <li key={row.id} className={card}>
            <h3 className="text-3xl capitalize">{row.kind}{row.read_at ? "" : " · Unread"}</h3>
            <p>{date.format(new Date(row.created_at))}</p>
            <Details record={row.payload} labels={{ name: "Name", email: "Email", subject: "Subject", message: "Message", mobile: "Mobile", gem: "Gem", budget: "Budget", colour: "Colour", size: "Size", notes: "Notes", stones: "Stones" }} />
            {!row.read_at && <form action={readMessage.bind(null, row.id)}>
              <button type="submit" className="admin-button">Mark as read</button>
            </form>}
          </li>
        })}
      </ul>}
    {(page > 1 || response.data.length > pageSize) && <nav className="flex gap-3" aria-label="Admin result pages">
      {page > 1 && <Link className="admin-button" href={nav(section, page - 1, status)} prefetch={false}>Previous page</Link>}
      {page < 10000 && response.data.length > pageSize && <Link className="admin-button" href={nav(section, page + 1, status)} prefetch={false}>Next page</Link>}
    </nav>}
    </section>
  </div>
}
