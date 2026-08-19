import type { PrismaClient } from "../../schema/generated/prisma/client.js";

import { ensureOrganizationPlan } from "../../src/provision-organization.js";

type SeedUserOrgConfig = {
  orgId: string;
  orgName: string;
  orgSlug: string;
  ownerId: string;
};

export const seedOwnerOrganization = async (
  prisma: PrismaClient,
  config: SeedUserOrgConfig,
) => {
  const { orgId, orgName, orgSlug, ownerId } = config;

  const existingOrg = await prisma.organization.findUnique({
    where: { slug: orgSlug },
  });

  const organizationId = existingOrg?.id ?? orgId;

  if (!existingOrg) {
    await prisma.organization.create({
      data: {
        id: orgId,
        name: orgName,
        slug: orgSlug,
        createdAt: new Date(),
      },
    });
    console.log(`✓ Organization seeded: ${orgSlug}`);
  } else {
    console.log(`✓ Organization already exists: ${orgSlug}`);
  }

  const { seededSubscription, seededCredit } = await ensureOrganizationPlan(
    prisma,
    organizationId,
    "TRIAL",
  );
  if (seededSubscription) {
    console.log(`✓ Trial subscription seeded: ${orgSlug}`);
  }
  if (seededCredit) {
    console.log(`✓ Trial credit seeded: ${orgSlug}`);
  }

  const existingMember = await prisma.member.findFirst({
    where: {
      organizationId,
      userId: ownerId,
    },
  });

  if (existingMember) {
    console.log(`✓ Owner membership already exists: ${orgSlug}`);
    return;
  }

  await prisma.member.create({
    data: {
      id: `mem_${organizationId}_${ownerId}`,
      organizationId,
      userId: ownerId,
      role: "owner",
      createdAt: new Date(),
    },
  });

  console.log(`✓ Owner membership seeded: ${orgSlug}`);
};
