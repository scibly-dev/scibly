import { loadPackageEnv } from "@scibly/lib/internal";

import "dotenv/config";

const env = loadPackageEnv("@scibly/collab", {
  COLLAB_PORT: process.env.COLLAB_PORT,
  COLLAB_TRUST_PROXY: process.env.COLLAB_TRUST_PROXY,
  COLLAB_CLEANUP_INTERVAL_MS:
    process.env.COLLAB_CLEANUP_INTERVAL_MS || String(5 * 60_000),
  COLLAB_TOKEN_SECRET:
    process.env.COLLAB_TOKEN_SECRET ?? process.env.BETTER_AUTH_SECRET,
  NODE_ENV: process.env.NODE_ENV,
});

if (env.COLLAB_TOKEN_SECRET.length < 32) {
  throw new Error(
    "@scibly/collab COLLAB_TOKEN_SECRET must be at least 32 characters and match the app token issuer.",
  );
}

export const config = {
  port: parseInt(env.COLLAB_PORT, 10),

  trustProxy: env.COLLAB_TRUST_PROXY === "true",
  nodeEnv: env.NODE_ENV,
  cleanupIntervalMs: parseInt(env.COLLAB_CLEANUP_INTERVAL_MS, 10),
  tokenSecret: env.COLLAB_TOKEN_SECRET,
} as const;
