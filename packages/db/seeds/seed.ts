import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../schema/generated/prisma/client.js";
import { getPgDatabaseUrl } from "../src/pg-database-url.js";
import { runDevSeeds } from "./dev/index.js";
import { runProdSeeds } from "./prod/index.js";

const adapter = new PrismaPg({ connectionString: getPgDatabaseUrl() });
const prisma = new PrismaClient({ adapter });

import { loadPackageEnv } from "@scibly/lib/internal";

const env = loadPackageEnv("@scibly/db", {
  NODE_ENV: process.env.NODE_ENV,
});

const seed = async () => {
  const isProd = env.NODE_ENV === "production";

  console.log(
    `\n🌱 Running seeds (${isProd ? "production" : "development"})...\n`,
  );

  await runProdSeeds(prisma);

  if (!isProd) {
    await runDevSeeds(prisma);
  }

  console.log("\n✅ Seeding complete!\n");
};

seed()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
