import { spawn } from "node:child_process"
import { readFile } from "node:fs/promises"
import { PGlite } from "@electric-sql/pglite"
import { PGLiteSocketServer } from "@electric-sql/pglite-socket"
import { fixtureAdminEmail, startAuthFixture } from "./neon-auth-fixture.mjs"
import { configuredPort, databasePort } from "./ports.mjs"

const db = await PGlite.create()
await db.exec(await readFile(new URL("../../prisma/migrations/20261123000100_initial/migration.sql", import.meta.url), "utf8"))
await db.exec(`
  insert into public.products
  (id,slug,name,gem_type,cut,carat,length_mm,width_mm,depth_mm,colour,clarity,treatment,origin,description,price_lkr,is_published,tint)
  values ('fd9f8831-e604-48cc-9d2c-79860244d258','fixture-sapphire','Fixture Sapphire','sapphire','Oval',2,8,6,4,'Blue','Eye clean','Heated','Sri Lanka','Browser fixture only.',125000,true,'#253e8c'),
  ('fd9f8831-e604-48cc-9d2c-79860244d259','fixture-garnet','Fixture Garnet','garnet','Cushion',1,6,6,3,'Red','Eye clean','None','Sri Lanka','Browser fixture only.',32000,true,'#782f51');

  insert into public.products
  (slug,name,gem_type,cut,carat,length_mm,width_mm,depth_mm,colour,clarity,treatment,origin,description,price_lkr,is_published,is_sample,tint)
  values ('fixture-sample','Fixture Sample','garnet','Oval',2,8,6,4,'Red','Eye clean','None','Sri Lanka','Sample fixture.',24000,true,true,'#782f51');
`)

const server = new PGLiteSocketServer({ db, port: databasePort, host: "127.0.0.1", maxConnections: 12 })
await server.start()
const auth = await startAuthFixture()

const child = spawn(process.execPath, ["./node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", String(configuredPort)], {
  stdio: "inherit",
  env: {
    ...process.env, VAULT_VEIN_BROWSER_FIXTURE: "1", NEXT_PUBLIC_SITE_URL: "https://vault-fixture.example",
    DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:" + databasePort + "/postgres?sslmode=disable",
    NEON_AUTH_BASE_URL: auth.url, NEON_AUTH_COOKIE_SECRET: "local-fixture-cookie-signing-secret-at-least-32",
    NEON_ADMIN_GOOGLE_EMAILS: fixtureAdminEmail,
    PAYHERE_MODE: "sandbox", PAYHERE_MERCHANT_ID: "000000", PAYHERE_MERCHANT_SECRET: "fixture-merchant-secret", SHIPPING_LKR: "500",
    CLOUDINARY_CLOUD_NAME: "vault-fixture", CLOUDINARY_API_KEY: "fixture-cloud-key", CLOUDINARY_API_SECRET: "fixture-cloud-secret",
    NODE_OPTIONS: [process.env.NODE_OPTIONS, "--import=" + new URL("./cloudinary-fixture.mjs", import.meta.url).href].filter(Boolean).join(" "),
  },
})

child.on("exit", async (code) => {
  auth.close()
  await server.stop()
  await db.close()
  process.exitCode = code ?? 1
})
