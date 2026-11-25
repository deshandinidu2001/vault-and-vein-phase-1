import Link from "next/link"
import { adminIdentity, requireAdminDatabase } from "@/lib/admin-auth"
import { formatPrice } from "@/lib/pricing"
import { readGemCategories } from "@/lib/gem-categories"
import { checkoutConfig, expireCheckouts } from "@/lib/checkout"
import { StoneMedia } from "@/components/product/stone-media"
import { getStoneOptions } from "@/lib/data"
import { deleteProduct, readMessage, setProductVisibility, shipOrder, signOut } from "./actions"
import { AdminShopFilters } from "./shop-filters"

const panels = { inventory: "Inventory", filters: "Shop filters", orders: "Orders", inbox: "Inbox" } as const
const stockFilters = ["available", "reserved", "sold"] as const
const results = {
  unavailable: "This change could not be applied. Refresh and check the current record.",
  saved: "Listing saved.",
  shipped: "Order marked as shipped.",
  read: "Message marked as read.",
  deleted: "Listing removed from the shop and inventory.",
  "category-saved": "Gem type visibility updated.",
  "gem-type-added": "Gem type added.",
  "filter-saved": "Shop filter visibility updated.",
  "filter-added": "Shop filter option added.",
  "filter-duplicate": "That filter option already exists.",
  "filter-invalid": "Enter a valid name for the new filter option.",
}
const card = "admin-panel min-w-0 space-y-3 p-5"
const date = new Intl.DateTimeFormat("en-LK", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Colombo" })
const pageSize = 20

function value(value: unknown) {
  if (Array.isArray(value)) return value.join(", ")
  return typeof value === "string" ? value.trim() : ""
}

function Details({ record, labels }: { record: unknown; labels: Record<string, string> }) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return null
  return <dl className="grid gap-2">
    {Object.entries(labels).map(([key, label]) => {
      const text = value((record as Record<string, unknown>)[key])
      return text && <div key={key} className="grid gap-1 sm:grid-cols-[7rem_minmax(0,1fr)]">
        <dt className="font-semibold">{label}</dt>
        <dd className="whitespace-pre-wrap wrap-anywhere">{text}</dd>
      </div>
    })}
  </dl>
}

export default async function AdminPage({ searchParams }: PageProps<"/vault8@vein@8">) {
  const db = await requireAdminDatabase()
  const { email } = await adminIdentity()
  const query = await searchParams
  const section = query.view === "categories" ? "filters"
    : query.view === "orders" || query.view === "inbox" || query.view === "filters" ? query.view : "inventory"
  const status = stockFilters.find((option) => query.status === option)
  const rawPage = typeof query.page === "string" ? Number(query.page) : 1
  const page = Number.isSafeInteger(rawPage) && rawPage >= 1 && rawPage <= 10000 ? rawPage : 1
  const offset = (page - 1) * pageSize
  function nav(panel: string, pageNumber = 1, filter?: string) {
    const params = new URLSearchParams({ view: panel })
    if (pageNumber > 1) params.set("page", String(pageNumber))
    if (panel === "inventory" && filter) params.set("status", filter)
    return "/vault8@vein@8?" + params
  }
  const result = typeof query.result === "string" && Object.hasOwn(results, query.result) ? results[query.result as keyof typeof results] : null

  const [categories] = await Promise.all([
    section === "inventory" || section === "filters" ? readGemCategories(db) : [],
    section === "inventory" || section === "orders" ? expireCheckouts(db) : null,
  ])
  const categoryNames = new Map(categories.map((category) => [category.slug, category]))
  const payment = section === "orders" ? checkoutConfig() : null

  const filterConfig = section === "filters" ? await getStoneOptions(categories) : null
  const paging = { skip: offset, take: pageSize + 1 }
  const records = section === "inventory"
    ? await db.product.findMany({
      ...paging, where: { archived_at: null, is_sample: false, status }, orderBy: [{ name: "asc" }, { id: "asc" }],
      select: { id: true, slug: true, name: true, gem_type: true, status: true, price_lkr: true,
        is_published: true, image_url: true },
    })
    : section === "orders" ? await db.order.findMany({
      ...paging, orderBy: [{ created_at: "desc" }, { id: "asc" }],
      select: { id: true, status: true, total_lkr: true, shipping_lkr: true, customer: true,
        created_at: true, order_items: { select: { name: true, price_lkr: true } } },
    })
    : section === "inbox" ? await db.inboxMessage.findMany({ ...paging, orderBy: [{ created_at: "desc" }, { id: "asc" }] })
    : []
  const rows = records.slice(0, pageSize)

  return <div className="admin-workspace">
    <div className="admin-titlebar">
      <h1>Store admin</h1>
      <div className="flex flex-wrap items-center justify-end gap-x-4">
        <Link href="/vault8@vein@8/account" className="admin-text-link">{email || "Account settings"}</Link>
        <form action={signOut}><button type="submit" className="admin-button">Sign out</button></form>
      </div>
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
      {section === "inventory" && <Link href="/vault8@vein@8/products/new" className="admin-button admin-button-primary" prefetch={false}>Add listing</Link>}
    </div>
    {section === "inventory" && <nav aria-label="Stock status" className="admin-filters">
      {[undefined, ...stockFilters].map((filter) => <Link key={filter ?? "all"} href={nav(section, 1, filter)}
        aria-current={status === filter ? "page" : undefined}>{filter ?? "All listings"}</Link>)}
    </nav>}
    {section === "orders" && <section className="admin-panel space-y-2 p-5" aria-labelledby="admin-checkout">
      <h3 id="admin-checkout" className="text-2xl">Online checkout</h3>
      {payment ? <p>PayHere is configured in {payment.mode} mode.</p> : <>
        <p>PayHere setup is pending. Add your payment settings to the server environment and restart the application.</p>
        <p className="max-w-none text-sm admin-muted"><code>PAYHERE_MERCHANT_ID</code>, <code>PAYHERE_MERCHANT_SECRET</code>, <code>PAYHERE_MODE</code>, <code>SHIPPING_LKR</code> and a public HTTPS <code>NEXT_PUBLIC_SITE_URL</code>.</p>
      </>}
    </section>}
    {filterConfig ? <AdminShopFilters {...filterConfig} />
      : rows.length === 0 ? <p className="admin-panel p-5">No {section === "inventory" ? "listings" : section === "orders" ? "orders" : "messages"} on this page.</p> :
      <ul className="admin-ledger">
        {rows.map((row) => {
          if ("is_published" in row) return <li key={row.id} className="admin-inventory-row admin-panel">
            <div className="admin-inventory-item">
              <div className="admin-photo admin-photo-thumb">
                <StoneMedia stone={row} label="" sizes="70px" width={180} />
              </div>
              <div className="min-w-0">
                <h3 className="wrap-anywhere">{row.name}</h3>
                <p className="admin-muted wrap-anywhere text-sm">
                  {categoryNames.get(row.gem_type)?.name ?? row.gem_type}
                  {categoryNames.get(row.gem_type)?.is_visible === false && " · Category hidden"}
                </p>
              </div>
            </div>
            <div className="admin-stock">
              <p className="font-semibold tabular-nums">{formatPrice(row.price_lkr, "LKR")}</p>
              <p className="admin-muted text-sm"><span className="admin-stock-status" data-status={row.status}>{row.status}</span> · {row.is_published ? "Published" : "Draft"}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {row.status === "available" && <Link className="admin-button" href={"/vault8@vein@8/products/" + row.id} prefetch={false}>Edit listing</Link>}
              {row.status !== "reserved" && <form action={setProductVisibility.bind(null, row.id, !row.is_published)}>
                <button type="submit" className="admin-button">{row.is_published ? "Unpublish" : "Publish"}</button>
              </form>}
              {row.is_published && categoryNames.get(row.gem_type)?.is_visible !== false && <Link className="admin-text-link" href={"/shop/" + row.slug}>View listing</Link>}
              {row.is_published && categoryNames.get(row.gem_type)?.is_visible === false && <Link className="admin-text-link" href={nav("filters") + "#filter-type"}>Manage gem type</Link>}
            </div>
            {row.status === "available" && <details className="admin-delete">
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
            <h3 className="text-3xl">{row.kind === "enquiry" ? "Stone question" : "Contact"}{row.read_at ? "" : " · Unread"}</h3>
            <p>{date.format(new Date(row.created_at))}</p>
            <Details record={row.payload} labels={{ name: "Name", email: "Email", subject: "Subject", message: "Message", mobile: "Mobile", gem: "Gem", budget: "Budget", colour: "Colour", size: "Size", notes: "Notes", stones: "Stones" }} />
            {!row.read_at && <form action={readMessage.bind(null, row.id)}>
              <button type="submit" className="admin-button">Mark as read</button>
            </form>}
          </li>
        })}
      </ul>}
    {(page > 1 || records.length > pageSize) && <nav className="flex gap-3" aria-label="Admin result pages">
      {page > 1 && <Link className="admin-button" href={nav(section, page - 1, status)} prefetch={false}>Previous page</Link>}
      {page < 10000 && records.length > pageSize && <Link className="admin-button" href={nav(section, page + 1, status)} prefetch={false}>Next page</Link>}
    </nav>}
    </section>
  </div>
}
