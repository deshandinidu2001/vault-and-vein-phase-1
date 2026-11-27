import { spawnSync } from "node:child_process"

const build = spawnSync(process.execPath, ["./node_modules/next/dist/bin/next", "build"], {
  env: { ...process.env, VAULT_CLOUDFLARE_BUILD: "1" },
  stdio: "inherit",
})

if (build.error) throw build.error
process.exitCode = build.status ?? 1
