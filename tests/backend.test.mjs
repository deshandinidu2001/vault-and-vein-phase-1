import assert from "node:assert/strict"
import { createHash, randomUUID } from "node:crypto"
import { readFile } from "node:fs/promises"
import { after, before, test } from "node:test"
import { PGlite } from "@electric-sql/pglite"
import { asPayHereAmount, checkoutHash, notification } from "../src/lib/payhere.ts"
import { productInput } from "../src/lib/admin-product.ts"
import { productPhotoUrl } from "../src/lib/product-photo.ts"

const db = new PGlite()
const migration = await readFile(new URL("../prisma/migrations/20261123000100_initial/migration.sql", import.meta.url), "utf8")
const mint = {
  slug: "mint", name: "Mint Stone", gem_type: "sapphire", cut: "Oval", carat: 2.14,
  length_mm: 8.30, width_mm: 6.40, depth_mm: 4.20, colour: "Green", clarity: "Eye clean",
  treatment: "Heated", origin: "Sri Lanka", description: "A test fixture.", price_lkr: 125000,
  is_published: true, is_sample: false, is_featured: false, certified: false, tint: "#227744", collections: [],
}
const customer = { first_name: "Example", last_name: "Customer", email: "buyer@example.test" }

before(async () => {
  await db.exec(migration)
  await db.exec("create role store_guest")
})
after(() => db.close())

test("combined request limits preserve both quotas, reclaim expired buckets and restrict execution", async () => {
  assert.equal((await db.query("select has_function_privilege('store_guest','public.permit_store_request(text,text,integer)','execute') as allowed")).rows[0].allowed, false)
  await db.query("insert into public.rate_limits values ('stale', now() - interval '2 days', 1)")
  const hit = async (source, email, max) => (await db.query("select public.permit_store_request($1,$2,$3) as ok", [source,email,max])).rows[0].ok
  assert.equal(await hit("first","one",1), true)
  assert.equal(await hit("first","two",1), false)
  for (let i=0; i<6; i++) assert.equal(await hit("other","two",30), true)
  assert.equal(await hit("other","two",30), false)
  assert.equal((await db.query("select key from public.rate_limits where key='stale'")).rows.length, 0)
})

async function stone(overrides = {}) {
  const input = { ...mint, slug: randomUUID(), ...overrides }
  const fields = Object.keys(input)
  const query = await db.query(
    "insert into public.products (" + fields.join(",") + ") values (" + fields.map((_, index) => "$" + (index + 1)).join(",") + ") returning *",
    Object.values(input),
  )
  return query.rows[0]
}

async function reserve(ids, token = randomUUID(), shipping = 500, buyer = customer) {
  const { rows } = await db.query("select public.reserve_checkout($1::uuid[], $2::jsonb, $3, $4) as placed", [ids, buyer, shipping, token])
  return rows[0].placed
}

async function event(order, code, payment = randomUUID(), amount = order.total_lkr) {
  const { rows } = await db.query("select public.apply_payment($1, $2, $3, $4) as accepted", [order.id, amount, payment, code])
  return rows[0].accepted
}

async function status(table, id) {
  const { rows } = await db.query("select status from public." + table + " where id = $1", [id])
  return rows[0].status
}

test("filter settings preserve listings and enforce valid options", async () => {
  const product = await stone({ cut: "Marquise", collections: ["estate-stones"] })
  await db.exec("insert into public.shop_filter_settings (filter_key, value, label) values ('cut','marquise','Marquise'), ('collection','estate-stones','Estate stones'), ('price','','')")
  await db.exec("update public.shop_filter_settings set is_visible = false where filter_key = 'price' or value = 'marquise'")
  await assert.rejects(db.exec("insert into public.shop_filter_settings (filter_key,value,label) values ('price','5','Five')"), /check constraint/)
  const settings = await db.query("select value, is_visible from public.shop_filter_settings order by value")
  assert.deepEqual(settings.rows, [
    { value: "", is_visible: false }, { value: "estate-stones", is_visible: true }, { value: "marquise", is_visible: false },
  ])
  assert.deepEqual((await db.query("select id from public.products where id = $1", [product.id])).rows, [{ id: product.id }])
})

test("a role without grants cannot read or mutate store records or call restricted functions", async () => {
  const live = await stone()
  const user = randomUUID()
  await db.query("insert into public.admin_users (id,email,password_hash) values ($1,$2,$3)", [user, "admin@example.test", "test-hash"])
  await db.query("insert into public.inbox (kind,email,payload) values ('contact',$1,$2)", [customer.email, { name: "Example" }])
  const order = await reserve([live.id])
  await db.exec("set role store_guest")
  try {
    for (const table of ["products", "gem_categories", "shop_filter_settings", "admin_users", "admin_sessions",
      "inbox", "orders", "order_items", "stock_holds", "payment_events", "rate_limits"]) {
      await assert.rejects(db.query("select * from public." + table), /permission denied/)
    }
    await assert.rejects(db.query("update public.products set price_lkr = 1 where id = $1", [live.id]), /permission denied/)
    await assert.rejects(reserve([live.id]), /permission denied/)
    await assert.rejects(event(order, "2"), /permission denied/)
  } finally {
    await db.exec("reset role")
  }
  assert.equal((await db.query("update public.inbox set read_at = now() where read_at is null returning id")).rows.length, 1)
  assert.equal(await event(order, "2"), true)
  const shipped = await db.query("update public.orders set status = 'shipped', shipped_at = now() where id = $1 and status = 'paid' returning status", [order.id])
  assert.deepEqual(shipped.rows, [{ status: "shipped" }])
})

test("prices come from the catalogue and only available live stones can be held", async () => {
  const first = await stone({ price_lkr: 250000 })
  const second = await stone({ price_lkr: 120000 })
  const demo = await stone({ is_sample: true })
  const draft = await stone({ is_published: false })
  const token = randomUUID()
  await assert.rejects(reserve([first.id, first.id]), /stones are unavailable/)
  await assert.rejects(reserve([first.id, draft.id]), /stones are unavailable/)
  await assert.rejects(reserve([first.id, demo.id]), /stones are unavailable/)
  assert.equal(await status("products", first.id), "available")
  const order = await reserve([first.id, second.id], token, 1000)
  assert.equal(order.total_lkr, 371000)
  assert.equal(order.public_token, token)
  assert.equal(await status("products", first.id), "reserved")
  assert.equal((await reserve([second.id, first.id], token, 1000)).id, order.id)
  await assert.rejects(reserve([first.id], token, 1000), /attempt already used/)
  await assert.rejects(reserve([first.id, second.id], token, 1000, { first_name: "Other" }), /attempt already used/)
  await assert.rejects(reserve([first.id]), /stones are unavailable/)
})

test("deleting listings preserves order history while preventing checkout", async () => {
  await db.exec("insert into public.gem_categories (slug,name) values ('aquamarine','Aquamarine')")
  const product = await stone({ gem_type: "aquamarine" })
  const order = await reserve([product.id])
  await assert.rejects(db.query("update public.products set archived_at = now(), is_published = false where id = $1", [product.id]), /archived_products_are_unpublished/)
  assert.equal(await event(order, "-1"), true)
  await db.query("update public.products set archived_at = now(), is_published = false where id = $1", [product.id])
  await assert.rejects(reserve([product.id]), /stones are unavailable/)
  assert.deepEqual((await db.query("select product_id from public.order_items where order_id = $1", [order.id])).rows, [{ product_id: product.id }])
  await db.exec("update public.gem_categories set name = 'Blue Beryl' where slug = 'aquamarine'")
  await assert.rejects(db.exec("delete from public.gem_categories where slug = 'aquamarine'"), /foreign key constraint/)
})

test("hidden gem types cannot be bought", async () => {
  const product = await stone({ gem_type: "garnet" })
  await db.exec("insert into public.gem_categories (slug,name) values ('test-gem','Test gem')")
  await db.exec("update public.gem_categories set is_visible = false where slug = 'garnet'")
  await assert.rejects(reserve([product.id]), /stones are unavailable/)
  assert.equal(await status("products", product.id), "available")
  await db.exec("update public.gem_categories set is_visible = true where slug = 'garnet'")
  assert.ok(await reserve([product.id]))
})

test("product photos use a restricted Cloudinary delivery path", async () => {
  const photo = "https://res.cloudinary.com/vault-fixture/image/upload/v1/vault-and-vein/products/" + randomUUID() + ".png"
  const product = await stone({ image_url: photo })
  assert.equal(product.image_url, photo)
  assert.deepEqual(product.gallery_urls, [])
  const extra = photo.replace(/[^/]+$/, randomUUID() + ".png")
  const { rows } = await db.query("update public.products set gallery_urls = $1 where id = $2 returning gallery_urls", [[extra], product.id])
  assert.deepEqual(rows[0].gallery_urls, [extra])
  for (const invalid of [[photo], [extra, extra], [null], ["https://example.test/extra.png"]]) {
    await assert.rejects(db.query("update public.products set gallery_urls = $1 where id = $2", [invalid, product.id]), /products_gallery_check/)
  }
  assert.match(productPhotoUrl(photo, 180), /\/c_limit,w_180,f_auto,q_auto\/v1\//)
  for (const invalid of [photo + "?other=1", photo.replace("res.cloudinary.com", "example.test"), photo.replace(/\.png$/, ".svg")]) {
    assert.equal(productPhotoUrl(invalid, 180), null)
    await assert.rejects(stone({ image_url: invalid }), /products_image_url_check/)
  }
})

test("paid, pending, duplicate and chargeback notifications preserve inventory", async () => {
  const product = await stone()
  const order = await reserve([product.id])
  const payment = randomUUID()
  assert.equal(await event(order, "2", payment, 10), false)
  assert.equal(await status("orders", order.id), "pending")
  assert.equal(await event(order, "0", payment), true)
  assert.equal(await event(order, "2", payment), true)
  assert.equal(await event(order, "2", payment), true)
  assert.equal(await event(order, "-1", payment), true)
  assert.equal(await status("orders", order.id), "paid")
  assert.equal(await status("products", product.id), "sold")
  assert.equal((await db.query("select count(*)::int as n from public.payment_events where order_id = $1 and status_code = '2'", [order.id])).rows[0].n, 1)
  assert.equal(await event(order, "-3", payment), true)
  assert.equal(await status("orders", order.id), "review")
  assert.equal(await status("products", product.id), "sold")
})

test("expiry and unsuccessful payment release only their own stock holds", async () => {
  const product = await stone()
  const old = await reserve([product.id])
  await db.query("update public.orders set expires_at = now() - interval '1 minute' where id = $1", [old.id])
  const current = await reserve([product.id])
  assert.equal(await status("orders", old.id), "expired")
  assert.equal(await event(old, "-1"), true)
  assert.equal(await event(old, "2"), true)
  assert.equal(await status("orders", old.id), "review")
  assert.equal(await status("products", product.id), "reserved")
  assert.equal(await event(current, "-2"), true)
  assert.equal(await status("orders", current.id), "failed")
  assert.equal(await status("products", product.id), "available")
  const newOrder = await reserve([product.id])
  assert.equal(await event(newOrder, "-1"), true)
  assert.equal(await status("orders", newOrder.id), "cancelled")
  assert.equal(await status("products", product.id), "available")
})

test("two checkout attempts cannot reserve the same stone", async () => {
  const product = await stone()
  const attempts = await Promise.allSettled([reserve([product.id]), reserve([product.id])])
  assert.equal(attempts.filter(({ status }) => status === "fulfilled").length, 1)
  assert.match(attempts.find(({ status }) => status === "rejected").reason.message, /stones are unavailable/)
})

test("message and checkout rate limit counters reset after their window", async () => {
  const key = randomUUID()
  const hit = async () => (await db.query("select public.consume_rate_limit($1, 2, 600) as ok", [key])).rows[0].ok
  assert.equal(await hit(), true)
  assert.equal(await hit(), true)
  assert.equal(await hit(), false)
  await db.query("update public.rate_limits set window_start = now() - interval '11 minutes' where key = $1", [key])
  assert.equal(await hit(), true)
})

test("PayHere signs exact LKR totals and rejects altered, unsigned and repeated fields", () => {
  const merchant = "000000"
  const secret = "test-secret"
  const id = "7a13082e-18aa-4a07-8300-8d617943aef3"
  const amount = asPayHereAmount(125000)
  assert.equal(amount, "125000.00")
  const md5 = (value) => createHash("md5").update(value).digest("hex").toUpperCase()
  assert.equal(checkoutHash(merchant, secret, id, amount), md5(merchant + id + amount + "LKR" + md5(secret)))
  const signed = new URLSearchParams({
    merchant_id: merchant, order_id: id, payment_id: "payment_1", payhere_amount: amount, payhere_currency: "LKR",
    status_code: "2", md5sig: md5(merchant + id + amount + "LKR2" + md5(secret)),
  })
  assert.deepEqual(notification(signed, merchant, secret), { order: id, payment: "payment_1", amount: 125000, status: "2" })
  for (const [field, value] of [["status_code", "-2"], ["payhere_amount", "1.00"], ["payhere_currency", "USD"], ["md5sig", "bad"], ["order_id", randomUUID()]]) {
    const changed = new URLSearchParams(signed)
    changed.set(field, value)
    assert.equal(notification(changed, merchant, secret), null)
  }
  signed.append("status_code", "2")
  assert.equal(notification(signed, merchant, secret), null)
})

test("admin validates editable listing values before database writes", () => {
  assert.equal(productInput.safeParse(mint).success, true)
  assert.equal(productInput.safeParse({ ...mint, slug: "--broken" }).success, false)
  assert.equal(productInput.safeParse({ ...mint, carat: "2.145" }).success, false)
  assert.equal(productInput.safeParse({ ...mint, price_lkr: 0 }).success, false)
  assert.equal(productInput.safeParse({ ...mint, collections: ["Invalid collection"] }).success, false)
  assert.equal(productInput.safeParse({ ...mint, cut: "Marquise", collections: ["estate-stones"] }).success, true)
})
