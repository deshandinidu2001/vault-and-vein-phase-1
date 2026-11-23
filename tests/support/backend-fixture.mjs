import { spawn } from "node:child_process"
import { createServer } from "node:http"
import { readFile } from "node:fs/promises"
import { PGlite } from "@electric-sql/pglite"
import { configuredPort, databasePort, localUrl } from "./ports.mjs"

const db = new PGlite()
const admin = "64844972-2262-4674-b01b-882fd9a127fb"
const visitor = "fe7f1303-ad69-46a7-9d6a-f4ac8081d6a5"
const stone = "fd9f8831-e604-48cc-9d2c-79860244d258"
const service = "fixture-service-key"
const anonymous = "fixture-anon-key"
const emailPrefix = "vault-fixture"
let fixturePassword = "fixture-password"
const api = localUrl(databasePort)
const productFields = ["slug", "name", "gem_type", "cut", "carat", "length_mm", "width_mm", "depth_mm", "colour", "clarity",
  "treatment", "origin", "description", "price_lkr", "tint", "certified", "is_featured", "is_published", "is_sample", "collections"]

await db.exec("create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users (id uuid primary key);")
for (const name of ["202611180001_catalogue.sql", "202611180002_checkout.sql", "202611190001_inventory_management.sql", "202611190002_product_photos_and_category_visibility.sql", "202611190003_shop_filter_settings.sql", "202611190004_product_galleries_and_gem_types.sql", "202611190005_request_limits.sql"]) {
  await db.exec(await readFile(new URL("../../supabase/migrations/" + name, import.meta.url), "utf8"))
}
await db.query("insert into auth.users values ($1), ($2);", [admin, visitor])
await db.query("insert into public.admin_users values ($1);", [admin])
await db.query(`
  insert into public.products
  (id,slug,name,gem_type,cut,carat,length_mm,width_mm,depth_mm,colour,clarity,treatment,origin,description,price_lkr,is_published,tint)
  values ($1,'fixture-sapphire','Fixture Sapphire','sapphire','Oval',2,8,6,4,'Blue','Eye clean','Heated','Sri Lanka','Browser fixture only.',125000,true,'#253e8c')
`, [stone])
await db.query(`
  insert into public.products
  (slug,name,gem_type,cut,carat,length_mm,width_mm,depth_mm,colour,clarity,treatment,origin,description,price_lkr,is_published,is_sample,tint)
  values ('fixture-sample','Fixture Sample','garnet','Oval',2,8,6,4,'Red','Eye clean','None','Sri Lanka','Sample fixture.',24000,true,true,'#782f51')
`)

const json = (value) => Buffer.from(JSON.stringify(value)).toString("base64url")
function token(id) {
  return json({ alg: "HS256", typ: "JWT" }) + "." + json({ sub: id, email: user(id).email, role: "authenticated", aal: "aal1", exp: 4102444800 }) + ".Zml4dHVyZQ"
}
function user(id) {
  return { id, email: emailPrefix + (id === admin ? "-admin" : "-visitor") + "@example.test", aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {}, created_at: "2026-01-01T00:00:00Z",
    factors: [] }
}

function one(rows) {
  return rows.length ? rows[0] : null
}

async function rest(table, method, url, input, privileged) {
  const id = url.searchParams.get("id")?.slice(3)
  if (table === "products" && method === "GET") {
    if (id) return one((await db.query("select * from public.products where id = $1" +
      (privileged ? "" : " and archived_at is null and is_published and exists (select 1 from public.gem_categories c where c.slug = gem_type and c.is_visible)"), [id])).rows)
    const photo = url.searchParams.get("image_url")?.slice(3)
    if (photo && privileged) return (await db.query("select id from public.products where image_url = $1", [photo])).rows
    const status = url.searchParams.get("status")?.slice(3) ?? null
    const query = "select * from public.products where archived_at is null and ($1::text is null or status = $1)"
    const slug = url.searchParams.get("slug")?.slice(3) ?? null
    const limit = Number(url.searchParams.get("limit") ?? 500)
    return (await db.query(query + (privileged ? "" : " and is_published and exists (select 1 from public.gem_categories c where c.slug = gem_type and c.is_visible)") + " and ($2::text is null or slug=$2) order by name limit $3", [status,slug,limit])).rows
  }
  if (table === "gem_categories" && method === "GET") {
    return (await db.query("select * from public.gem_categories where $1 or is_visible order by name", [privileged])).rows
  }
  if (table === "shop_filter_settings" && method === "GET") {
    return (await db.query("select * from public.shop_filter_settings order by filter_key,value")).rows
  }
  if (!privileged) throw new Error("Fixture rejected a private database request")
  if (table === "gem_categories" && method === "POST") {
    await db.query("insert into public.gem_categories (slug,name) values ($1,$2)", [input.slug, input.name])
    return null
  }
  if (table === "shop_filter_settings" && method === "POST") {
    return (await db.query("insert into public.shop_filter_settings (filter_key,value,label,is_visible) values ($1,$2,$3,$4) returning filter_key",
      [input.filter_key, input.value, input.label, input.is_visible ?? true])).rows
  }
  if (table === "shop_filter_settings" && method === "PATCH") {
    return (await db.query("update public.shop_filter_settings set is_visible=$1 where filter_key=$2 and value=$3 returning filter_key",
      [input.is_visible, url.searchParams.get("filter_key")?.slice(3), url.searchParams.get("value")?.slice(3)])).rows
  }
  if (table === "gem_categories" && method === "PATCH") {
    return (await db.query("update public.gem_categories set is_visible = $1 where slug = $2 returning slug",
      [input.is_visible, url.searchParams.get("slug")?.slice(3)])).rows
  }
  if (table === "rpc/consume_rate_limit") {
    return (await db.query("select public.consume_rate_limit($1,$2,$3) as allowed", [input.p_key, input.p_max, input.p_seconds])).rows[0].allowed
  }
  if (table === "rpc/permit_store_request") {
    return (await db.query("select public.permit_store_request($1,$2,$3) as allowed", [input.p_source, input.p_identity, input.p_source_max])).rows[0].allowed
  }
  if (table === "rpc/reserve_checkout") {
    return (await db.query("select public.reserve_checkout($1,$2,$3,$4) as order_data", [input.p_ids, input.p_customer, input.p_shipping, input.p_token])).rows[0].order_data
  }
  if (table === "rpc/apply_payment") {
    return (await db.query("select public.apply_payment($1,$2,$3,$4) as ok", [input.p_order_id, input.p_amount, input.p_payment_id, input.p_status])).rows[0].ok
  }
  if (table === "rpc/expire_checkouts") {
    await db.exec("select public.expire_checkouts()")
    return null
  }
  if (table === "admin_users" && method === "GET") {
    return (await db.query("select user_id from public.admin_users where user_id = $1", [url.searchParams.get("user_id")?.slice(3)])).rows
  }
  if (table === "orders" && method === "GET") {
    const query = "select o.*, (select jsonb_agg(i) from public.order_items i where i.order_id = o.id) as order_items from public.orders o";
    return id
      ? (await db.query(query + " where o.id = $1 and o.public_token = $2", [id, url.searchParams.get("public_token")?.slice(3)])).rows
      : (await db.query(query + " order by o.created_at desc")).rows
  }
  if (table === "orders" && method === "PATCH") {
    return (await db.query("update public.orders set status = $1, shipped_at = $2 where id = $3 and status = 'paid' returning id", [input.status, input.shipped_at, id])).rows
  }
  if (table === "inbox" && method === "GET") return (await db.query("select * from public.inbox order by created_at desc")).rows
  if (table === "inbox" && method === "POST") {
    await db.query("insert into public.inbox (kind,email,payload) values ($1,$2,$3)", [input.kind, input.email, input.payload])
    return null
  }
  if (table === "inbox" && method === "PATCH") {
    return (await db.query("update public.inbox set read_at = $1 where id = $2 and read_at is null returning id", [input.read_at, id])).rows
  }
  if (table === "products" && method === "POST") {
    const fields = "image_url" in input ? [...productFields, "image_url"] : productFields
    const params = fields.map((_, index) => "$" + (index + 1))
    return (await db.query("insert into public.products (" + fields.join(",") + ") values (" + params.join(",") + ") returning id",
      fields.map((key) => input[key]))).rows
  }
  if (table === "products" && method === "PATCH") {
    if ("gallery_revision" in input) return (await db.query(
      "update public.products set image_url=$1, gallery_urls=$2, gallery_revision=$3 where id=$4 and gallery_revision=$5 and archived_at is null and status='available' returning id",
      [input.image_url, input.gallery_urls, input.gallery_revision, id, url.searchParams.get("gallery_revision")?.slice(3)],
    )).rows
    if ("archived_at" in input) return (await db.query(
      "update public.products set archived_at = $1, is_published = false where id = $2 and archived_at is null and status = 'available' returning id",
      [input.archived_at, id],
    )).rows
    if ("name" in input) {
      const fields = "image_url" in input ? [...productFields, "image_url"] : productFields
      const changes = fields.map((field, index) => field + " = $" + (index + 2)).join(",")
      const current = url.searchParams.get("image_url")
      const filter = !current ? "" : current === "is.null" ? " and image_url is null" : " and image_url = $" + (fields.length + 2)
      return (await db.query("update public.products set " + changes + " where id = $1 and archived_at is null and status = 'available'" + filter + " returning id",
        [id, ...fields.map((key) => input[key]), ...(current?.startsWith("eq.") ? [current.slice(3)] : [])])).rows
    }
    return (await db.query("update public.products set is_published = $1 where id = $2 and archived_at is null and status <> 'reserved' returning id", [input.is_published, id])).rows
  }
  throw new Error(method + " " + table + " is outside the local fixture")
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, api)
  const send = (status, data) => {
    response.writeHead(status, { "Content-Type": "application/json" })
    response.end(JSON.stringify(data))
  }
  try {
    const chunks = []
    for await (const chunk of request) chunks.push(chunk)
    const input = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {}
    if (url.pathname === "/auth/v1/token") {
      const id = [admin, visitor].find((id) => user(id).email === input.email)
      if (!id || input.password !== fixturePassword) return send(400, { message: "Invalid credentials" })
      return send(200, { access_token: token(id), token_type: "bearer", expires_in: 3600, refresh_token: id, user: user(id) })
    }
    const id = [admin, visitor].find(id => request.headers.authorization === "Bearer " + token(id))
    if (url.pathname === "/auth/v1/user") {
      if (request.method === "PUT") {
        if (id !== admin || input.current_password !== fixturePassword) return send(403, { message: "Current password required" })
        fixturePassword = input.password
      }
      return id ? send(200, user(id)) : send(401, { message: "Unauthorized" })
    }
    if (url.pathname === "/auth/v1/logout") return send(200, {})
    const authorization = request.headers.apikey
    if (!url.pathname.startsWith("/rest/v1/") || ![service, anonymous].includes(authorization)) return send(401, { message: "Unauthorized" })
    const result = await rest(url.pathname.slice("/rest/v1/".length), request.method, url, input, authorization === service)
    const body = request.headers.accept?.includes("vnd.pgrst.object") && Array.isArray(result) ? one(result) : result
    send(200, body)
  } catch (error) {
    send(["P0001", "23505", "23503"].includes(error.code) ? 400 : 500, { code: error.code, message: error.message })
  }
})
await new Promise((resolve) => server.listen(databasePort, "127.0.0.1", resolve))

const child = spawn(process.execPath, ["./node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", String(configuredPort)], {
  stdio: "inherit",
  env: {
    ...process.env, VAULT_VEIN_BROWSER_FIXTURE: "1", NEXT_PUBLIC_SITE_URL: "https://vault-fixture.example", NEXT_PUBLIC_SUPABASE_URL: api,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anonymous, SUPABASE_SERVICE_ROLE_KEY: service,
    PAYHERE_MODE: "sandbox", PAYHERE_MERCHANT_ID: "000000", PAYHERE_MERCHANT_SECRET: "fixture-merchant-secret", SHIPPING_LKR: "500",
    CLOUDINARY_CLOUD_NAME: "vault-fixture", CLOUDINARY_API_KEY: "fixture-cloud-key", CLOUDINARY_API_SECRET: "fixture-cloud-secret",
    NODE_OPTIONS: [process.env.NODE_OPTIONS, "--import=" + new URL("./cloudinary-fixture.mjs", import.meta.url).href].filter(Boolean).join(" "),
  },
})
child.on("exit", async (code) => {
  server.closeAllConnections()
  server.close()
  await db.close()
  process.exitCode = code ?? 1
})
