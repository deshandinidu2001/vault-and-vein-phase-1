import { defineConfig, devices } from "@playwright/test"

const localUrl = "http://127.0.0.1:3210"
const externalUrl = process.env.PLAYWRIGHT_BASE_URL

export default defineConfig({
  testDir: "./tests",
  outputDir: "test-results/storefront",
  testMatch: "**/storefront.spec.ts",
  timeout: 60_000,
  workers: 2,
  reporter: "list",
  use: { baseURL: externalUrl || localUrl, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 940 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: externalUrl ? undefined : {
    command: "npm run build && npm run start -- --hostname 127.0.0.1 --port 3210",
    url: localUrl,
    timeout: 180_000,
    env: {
      NEXT_PUBLIC_SITE_URL: localUrl,
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
      SUPABASE_SERVICE_ROLE_KEY: "",
      PAYHERE_MODE: "",
      PAYHERE_MERCHANT_ID: "",
      PAYHERE_MERCHANT_SECRET: "",
    },
  },
})
