import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { PrismaClient } from "../schema/generated/prisma/client";

// Bypasses the app's cached singleton for integration tests that need real Postgres behaviour (row locking, guarded updates); never import outside tests.
export const createTestPrismaClient = (connectionString: string) => {
  const pool = new Pool({
    connectionString,
    max: 5,
    connectionTimeoutMillis: 10_000,
  });
  return new PrismaClient({ adapter: new PrismaPg(pool) });
};
