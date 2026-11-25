import { defineConfig, devices } from "@playwright/test"
import { localUrl, storefrontPort } from "./tests/support/ports.mjs"

const storefrontUrl = localUrl(storefrontPort)
const externalUrl = process.env.PLAYWRIGHT_BASE_URL

export default defineConfig({
  testDir: "./tests",
  outputDir: "test-results/storefront",
  testMatch: "**/storefront.spec.ts",
  timeout: 60_000,
  workers: 2,
  reporter: "list",
  use: { baseURL: externalUrl || storefrontUrl, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 940 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: externalUrl ? undefined : {
    command: "npm run build && npm run start -- --hostname 127.0.0.1 --port " + storefrontPort,
    url: storefrontUrl,
    timeout: 180_000,
    env: {
      NEXT_PUBLIC_SITE_URL: storefrontUrl,
      DATABASE_URL: "",
      DATABASE_URL_UNPOOLED: "",
      DIRECT_URL: "",
      NEON_AUTH_BASE_URL: "",
      NEON_AUTH_COOKIE_SECRET: "",
      NEON_ADMIN_GOOGLE_EMAILS: "",
      PAYHERE_MODE: "",
      PAYHERE_MERCHANT_ID: "",
      PAYHERE_MERCHANT_SECRET: "",
    },
  },
})
