import type { PrismaClient } from "../../schema/generated/prisma/client.js";

import { DEV_DUMMY_ORG, DEV_DUMMY_USER } from "../constants/dev-seed-data.js";
import { seedCyberSafetyCourse } from "./seed-cyber-safety-course.js";
import { seedDummyOrgData } from "./seed-dummy-org-data.js";
import { seedDummyUser } from "./seed-dummy-user.js";

export const runDevSeeds = async (prisma: PrismaClient) => {
  await seedDummyUser(prisma);
  await seedDummyOrgData(prisma);
  await seedCyberSafetyCourse(prisma, {
    orgSlug: DEV_DUMMY_ORG.slug,
    organizationId: DEV_DUMMY_ORG.id,
    publishedById: DEV_DUMMY_USER.id,
  });
};
