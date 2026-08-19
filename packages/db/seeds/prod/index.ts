import type { PrismaClient } from "../../schema/generated/prisma/client.js";

import { PROD_SEED_USERS } from "../constants/prod-seed-data.js";
import { seedCyberSafetyCourse } from "../dev/seed-cyber-safety-course.js";
import { seedProdUsers } from "./seed-prod-users.js";

const PROD_DEMO_COURSE_ORG_SLUG = "scibly-academy" as const;

export const runProdSeeds = async (prisma: PrismaClient) => {
  await seedProdUsers(prisma, PROD_SEED_USERS);

  await seedCyberSafetyCourse(prisma, {
    orgSlug: PROD_DEMO_COURSE_ORG_SLUG,
  });
};
