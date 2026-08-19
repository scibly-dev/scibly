import "dotenv/config";

import { defineConfig } from "prisma/config";
import { loadPackageEnv } from "@scibly/lib/internal";

const env = loadPackageEnv("@scibly/db", {
  DATABASE_URL: process.env.DATABASE_URL,
});

export default defineConfig({
  schema: "./schema",
  typedSql: {
    path: "./schema/sql",
  },
  migrations: {
    path: "./migrations",
    seed: "tsx ./seeds/seed.ts",
  },
  datasource: {
    url: env.DATABASE_URL,
  },
});
