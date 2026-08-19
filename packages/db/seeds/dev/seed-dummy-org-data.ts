import type { PrismaClient } from "../../schema/generated/prisma/client.js";

import { DEV_DUMMY_USER } from "../constants/dev-seed-data.js";
import { hashCredentialPassword } from "../hash-credential-password.js";
import { generateOrgData } from "../helpers/seed-factory.js";

export const seedDummyOrgData = async (prisma: PrismaClient) => {
  const hashedPassword = await hashCredentialPassword("#Member#1234");

  await generateOrgData(prisma, {
    orgSlug: "scibly-dev",
    orgName: "Scibly Development",
    orgId: "org_dummy_dev_id",
    ownerId: DEV_DUMMY_USER.id,
    userPrefix: "dummy_user",
    numUsers: 50,
    numCourses: 20,
    hashedPassword,
  });
};
