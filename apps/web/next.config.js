import createMDX from "@next/mdx";
import path from "node:path";

import "./src/env.js";

import { getAllowedDevOrigins } from "../../scripts/lan-dev.mjs";

/** @type {import("next").NextConfig} */
const config = {
  output: "standalone",
  // Tracing defaults to this app's own folder, which in a workspace leaves
  // every @scibly/* package out of the standalone bundle.
  outputFileTracingRoot: path.join(import.meta.dirname, "../.."),
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  images: {
    qualities: [75, 85, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "scibly-assets.s3.eu-central-1.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  transpilePackages: [
    "@scibly/auth",
    "@scibly/db",
    "@scibly/api",
    "@scibly/i18n",
    "@scibly/next-proxy",
    "@scibly/routes",
    "@scibly/ui",
    "@scibly/email",
    "@scibly/schemas",
    "@scibly/lib",
    "@scibly/observability",
  ],
  allowedDevOrigins: getAllowedDevOrigins(),
  experimental: {
    mdxRs: {
      mdxType: "gfm",
    },
  },
  skipTrailingSlashRedirect: true,
};

const withMDX = createMDX({});

export default withMDX(config);
