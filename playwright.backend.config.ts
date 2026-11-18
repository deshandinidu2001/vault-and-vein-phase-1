import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests",
  outputDir: "test-results/configured",
  testMatch: "**/configured.spec.ts",
  timeout: 90_000,
  workers: 1,
  reporter: "list",
  use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:3211", trace: "retain-on-failure" },
  webServer: {
    command: "node tests/support/backend-fixture.mjs",
    url: "http://127.0.0.1:3211",
    timeout: 180_000,
  },
})
