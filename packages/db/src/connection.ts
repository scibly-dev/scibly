import { PrismaPg } from "@prisma/adapter-pg";
import { loadPackageEnv } from "@scibly/lib/internal";
import { Pool } from "pg";

import { PrismaClient } from "../schema/generated/prisma/client";
import { getPgDatabaseUrl } from "./pg-database-url";

const env = loadPackageEnv("@scibly/db", {
  NODE_ENV: process.env.NODE_ENV,
});

const createPrismaClient = () => {
  const isProduction = env.NODE_ENV === "production";

  const pool = new Pool({
    connectionString: getPgDatabaseUrl(),
    max: isProduction ? 1 : 10,
    idleTimeoutMillis: isProduction ? 5_000 : 30_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: isProduction,
  });

  const adapter = new PrismaPg(pool);
  // SAFETY: the extension only overwrites the existing user.create, it adds no new function.
  return new PrismaClient({
    adapter,
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  }).$extends({
    query: {
      user: {
        async create({ args, query }) {
          const lowerCaseEmail = args.data.email.trim().toLowerCase();
          return query({
            ...args,
            data: {
              ...args.data,
              email: lowerCaseEmail,
            },
          });
        },
      },
    },
  }) as PrismaClient;
};

declare global {
  var sciblyPrisma: PrismaClient | undefined;
}

// Cached on globalThis always, not just in dev — Next can load @scibly/db from multiple server chunks in one isolate, and each copy would otherwise open its own pool and exhaust Postgres connection slots (P2037).
export const db = (globalThis.sciblyPrisma ??= createPrismaClient());
