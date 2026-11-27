import type { NextConfig } from "next";

const cloudflareBuild = process.env.VAULT_CLOUDFLARE_BUILD === "1";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: { localPatterns: [
    { pathname: "/brand/**", search: "" },
    { pathname: "/images/hero/**", search: "" },
    { pathname: "/images/editorial/**", search: "" },
  ] },
  distDir: process.env.VAULT_VEIN_BROWSER_FIXTURE === "1" ? ".next-fixture" : ".next",
  ...(cloudflareBuild && {
    // Turbopack's Wasm loader can trace unrelated dependency binaries.
    // The Prisma Worker compiler is emitted separately as a Next.js chunk.
    outputFileTracingExcludes: {
      "/*": ["node_modules/{@electric-sql,@prisma/dev,prisma,miniflare,playwright-core,@tailwindcss}/**/*.wasm"],
    },
  }),
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  async headers() {
    return [
      { source: "/:path*", headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ...(process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://")
          ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }] : []),
      ] },
      { source: "/api/:path*", headers: [
        { key: "Cache-Control", value: "private, no-store" },
        { key: "Referrer-Policy", value: "no-referrer" },
      ] },
    ];
  },
  turbopack: {
    ...(cloudflareBuild && {
      resolveAlias: {
        "@/generated/prisma/client": "./src/generated/prisma-worker/client.ts",
      },
    }),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
