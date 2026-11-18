import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.VAULT_VEIN_BROWSER_FIXTURE === "1" ? ".next-fixture" : ".next",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
