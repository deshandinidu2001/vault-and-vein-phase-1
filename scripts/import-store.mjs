import { spawnSync } from "node:child_process"
import { existsSync, mkdtempSync, rmSync, rmdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

for (const path of [".env.local", ".env"]) {
  if (existsSync(path)) process.loadEnvFile(path)
}

const source = process.env.LEGACY_DATABASE_URL
const target = process.env.DATABASE_URL_UNPOOLED || process.env.DIRECT_URL
if (!source || !target || source === target) {
  console.error("Set LEGACY_DATABASE_URL and DATABASE_URL_UNPOOLED (or DIRECT_URL) to different PostgreSQL databases.")
  process.exit(1)
}

const tables = [
  "gem_categories", "products", "shop_filter_settings", "orders", "order_items", "stock_holds",
  "payment_events", "inbox",
]
const scratch = mkdtempSync(join(tmpdir(), "vault-store-import-"))
const dump = join(scratch, "store.sql")

function run(command, args, connection) {
  const url = new URL(connection)
  if (!["postgresql:", "postgres:"].includes(url.protocol) || !url.hostname || !url.pathname.slice(1)) {
    throw new Error("Use a PostgreSQL connection URL with a host and database name.")
  }
  const result = spawnSync(command, args, {
    windowsHide: true,
    env: {
      ...process.env,
      PGHOST: url.hostname.replace(/^\[|\]$/g, ""),
      PGPORT: url.port || "5432",
      PGDATABASE: decodeURIComponent(url.pathname.slice(1)),
      PGUSER: decodeURIComponent(url.username),
      PGPASSWORD: decodeURIComponent(url.password),
      PGSSLMODE: url.searchParams.get("sslmode") ?? "require",
      PGCHANNELBINDING: url.searchParams.get("channel_binding") ?? "prefer",
    },
  })
  if (result.error?.code === "ENOENT") throw new Error(command + " must be on PATH.")
  if (result.status !== 0) throw new Error(command + " failed. Check connectivity, schema versions and target emptiness.")
}

try {
  run("pg_dump", ["--data-only", "--no-owner", "--no-privileges", "--no-password", "--file", dump,
    ...tables.map(table => "--table=public." + table)], source)

  // Import into a newly migrated database. Preserve IDs, receipt keys and historical holds.
  const verifyEmpty = `
    LOCK TABLE ${tables.map(table => "public." + table).join(", ")} IN ACCESS EXCLUSIVE MODE;
    DO $$ BEGIN
      IF ${tables.filter(table => table !== "gem_categories").map(table => "EXISTS (SELECT 1 FROM public." + table + ")").join(" OR ")}
      OR EXISTS (SELECT 1 FROM public.gem_categories WHERE NOT is_builtin)
      THEN RAISE EXCEPTION 'The target store already has data'; END IF;
    END $$;
  `
  run("psql", ["-X", "--no-password", "--single-transaction", "--set=ON_ERROR_STOP=1",
    "-c", verifyEmpty,
    "-c", "DELETE FROM public.gem_categories",
    "-c", "ALTER TABLE public.stock_holds DISABLE TRIGGER stock_hold_category_visible",
    "-f", dump,
    "-c", "ALTER TABLE public.stock_holds ENABLE TRIGGER stock_hold_category_visible",
  ], target)
  console.log("Store data imported. Verify the catalogue and order counts before switching traffic.")
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  rmSync(dump, { force: true })
  rmdirSync(scratch)
}
