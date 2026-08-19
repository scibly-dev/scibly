import type { PrismaClient } from "../../schema/generated/prisma/client.js";

import {
  DEV_DUMMY_USER,
  DEV_DUMMY_USER_ACCOUNT_ID,
} from "../constants/dev-seed-data.js";
import { seedCredentialUsers } from "../helpers/seed-credential-users.js";

export const seedDummyUser = async (prisma: PrismaClient) => {
  await seedCredentialUsers(prisma, [
    {
      ...DEV_DUMMY_USER,
      accountId: DEV_DUMMY_USER_ACCOUNT_ID,
    },
  ]);
};
