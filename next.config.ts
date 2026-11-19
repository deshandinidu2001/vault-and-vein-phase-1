import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  distDir: process.env.VAULT_VEIN_BROWSER_FIXTURE === "1" ? ".next-fixture" : ".next",
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  async headers() {
    const publicPolicy = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""),
      "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob: https://res.cloudinary.com",
      "frame-src https://maps.google.com https://www.google.com", "frame-ancestors 'none'",
      "form-action 'self' https://sandbox.payhere.lk https://www.payhere.lk",
      "base-uri 'none'", "object-src 'none'",
    ].join("; ");
    return [
      { source: "/:path*", headers: [
        { key: "Content-Security-Policy", value: publicPolicy },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ] },
      ...["/admin/:path*", "/order/:path*", "/api/:path*"].map(source => ({ source, headers: [
        { key: "Cache-Control", value: "private, no-store" },
        { key: "Referrer-Policy", value: "no-referrer" },
      ] })),
    ];
  },
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
