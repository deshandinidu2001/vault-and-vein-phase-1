import { defineConfig, devices } from "@playwright/test"
import { configuredPort, localUrl } from "./tests/support/ports.mjs"

export default defineConfig({
  testDir: "./tests",
  outputDir: "test-results/configured",
  testMatch: "**/configured.spec.ts",
  timeout: 90_000,
  workers: 1,
  reporter: "list",
  use: { ...devices["Desktop Chrome"], baseURL: localUrl(configuredPort), trace: "retain-on-failure" },
  webServer: {
    command: "node tests/support/backend-fixture.mjs",
    url: localUrl(configuredPort),
    timeout: 180_000,
  },
})
