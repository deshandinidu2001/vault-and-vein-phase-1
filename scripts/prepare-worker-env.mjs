import { writeFileSync } from "node:fs";

// OpenNext copies dotenv values into this module. Workers receive their
// environment through runtime bindings, so no file-backed defaults are needed.
writeFileSync(
  new URL("../.open-next/cloudflare/next-env.mjs", import.meta.url),
  ["production", "development", "test"]
    .map((mode) => `export const ${mode} = {};\n`)
    .join(""),
);
