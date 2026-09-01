await import("./src/env.js");

import path from "node:path";

import { getAllowedDevOrigins } from "../../scripts/lan-dev.mjs";

/** @type {import("next").NextConfig} */
const config = {
  output: "standalone",
  // Tracing defaults to this app's own folder, which in a workspace leaves
  // every @scibly/* package out of the standalone bundle.
  outputFileTracingRoot: path.join(import.meta.dirname, "../.."),
  cacheComponents: true,
  // Keep one Yjs constructor identity across Turbopack server and SSR chunks.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "@napi-rs/canvas", "yjs"],
  allowedDevOrigins: getAllowedDevOrigins(),
  images: {
    qualities: [75, 85, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
    // 30s matches the tRPC query staleTime so both caches go stale together.
    staleTimes: {
      dynamic: 30,
      static: 300,
    },
    authInterrupts: true,
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-dialog",
    ],
  },
  turbopack: {},
  skipTrailingSlashRedirect: true,

  async headers() {
    return [
      {
        // Lives on customers' pages and cannot be cache-busted from our side,
        // so it is kept short-lived: a fix has to be able to reach them.
        source: "/embed/v1.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=300, must-revalidate",
          },
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
        ],
      },
    ];
  },

  // pdf.js reads its fonts and cmaps from disk, and @napi-rs/canvas picks its
  // native binding at runtime — neither is a static import for file tracing
  // to follow.
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/pdfjs-dist/standard_fonts/**",
      "./node_modules/pdfjs-dist/cmaps/**",
      "../../node_modules/.pnpm/@napi-rs+canvas@*/node_modules/@napi-rs/canvas-*/*",
      "./notebook-skills/**",
      "./knowledge-prompts/**",
    ],
  },

  transpilePackages: [
    "@scibly/auth",
    "@scibly/db",
    "@scibly/api",
    "@scibly/ee-billing",
    "@scibly/ee-organizations-billing",
    "@scibly/i18n",
    "@scibly/next-proxy",
    "@scibly/routes",
    "@scibly/ui",
    "@scibly/schemas",
    "@scibly/lib",
    "@scibly/observability",
  ],
};

export default config;
