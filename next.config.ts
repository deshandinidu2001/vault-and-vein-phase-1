import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: { localPatterns: [
    { pathname: "/brand/**", search: "" },
    { pathname: "/images/hero/**", search: "" },
    { pathname: "/images/editorial/**", search: "" },
  ] },
  distDir: process.env.VAULT_VEIN_BROWSER_FIXTURE === "1" ? ".next-fixture" : ".next",
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  async headers() {
    const publicPolicy = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""),
      "script-src-attr 'none'",
      "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob: https://res.cloudinary.com",
      "frame-src 'none'", "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'none'", "object-src 'none'",
    ].join("; ");
    return [
      { source: "/:path*", headers: [
        { key: "Content-Security-Policy", value: publicPolicy },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ...(process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://")
          ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }] : []),
      ] },
      ...["/vault8@vein@8/:path*", "/order/:path*", "/api/:path*"].map(source => ({ source, headers: [
        { key: "Cache-Control", value: "private, no-store" },
        { key: "Referrer-Policy", value: source.startsWith("/vault8@vein@8/") ? "same-origin" : "no-referrer" },
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
