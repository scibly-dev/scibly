import {
  type AllowanceWarning,
  readAllowanceWarning,
} from "@scibly/api/entitlement";
import { db } from "@scibly/db";

import {
  requireOrganizationBySlug,
  requireOrgMember,
} from "../../server/policy";

export async function readAllowanceWarningForOrg(
  orgSlug: string,
  userId: string,
): Promise<AllowanceWarning | null> {
  const { id: organizationId } = await requireOrganizationBySlug(orgSlug);
  await requireOrgMember(organizationId, userId, "owner");

  return readAllowanceWarning(db, organizationId);
}
