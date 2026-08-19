import createMDX from "@next/mdx";
import "./src/env.js";

import { getAllowedDevOrigins } from "../../scripts/lan-dev.mjs";

/** @type {import("next").NextConfig} */
const config = {
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
