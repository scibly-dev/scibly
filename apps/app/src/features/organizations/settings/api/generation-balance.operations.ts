import { spendableCredits } from "@scibly/api/entitlement";
import { db } from "@scibly/db";

import {
  requireOrganizationBySlug,
  requireOrgMember,
} from "../../server/policy";

export async function readGenerationBalance(
  orgSlug: string,
  userId: string,
): Promise<{ remaining: number | null }> {
  const { id: organizationId } = await requireOrganizationBySlug(orgSlug);
  await requireOrgMember(organizationId, userId, "owner");

  const credit = await db.organizationCredit.findUnique({
    where: { organizationId },
    select: { allowanceRemaining: true, topupRemaining: true },
  });

  if (!credit) return { remaining: null };

  return { remaining: spendableCredits(credit) };
}
