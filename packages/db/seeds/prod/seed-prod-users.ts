import type { PrismaClient } from "../../schema/generated/prisma/client.js";

import {
  PROD_SEED_PASSWORD,
  PROD_SEED_USERS,
  type SeedProdUser,
} from "../constants/prod-seed-data.js";
import { seedCredentialUsers } from "../helpers/seed-credential-users.js";
import { seedOwnerOrganization } from "../helpers/seed-user-org.js";

function toCredentialUsers(users: readonly SeedProdUser[]) {
  return users.map((user) => ({
    ...user,
    password: PROD_SEED_PASSWORD,
  }));
}

export const seedProdUsers = async (
  prisma: PrismaClient,
  users: readonly SeedProdUser[] = PROD_SEED_USERS,
) => {
  await seedCredentialUsers(prisma, toCredentialUsers(users));

  for (const user of users) {
    if (!user.org) {
      continue;
    }

    await seedOwnerOrganization(prisma, {
      orgId: user.org.id,
      orgName: user.org.name,
      orgSlug: user.org.slug,
      ownerId: user.id,
    });
  }
};
