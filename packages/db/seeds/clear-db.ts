import { PrismaPg } from "@prisma/adapter-pg";
import { loadPackageEnv } from "@scibly/lib/internal";

import { PrismaClient } from "../schema/generated/prisma/client.js";

const env = loadPackageEnv("@scibly/db", {
  DATABASE_URL: process.env.DATABASE_URL,
});

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const clearDB = async () => {
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verification.deleteMany();

  await prisma.user.deleteMany();

  console.log("Database cleared successfully");
};

clearDB()
  .catch((e) => {
    console.error("Error clearing database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
