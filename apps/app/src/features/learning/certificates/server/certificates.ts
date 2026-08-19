import { db } from "@scibly/db";

import "server-only";
import {
  requireOrganizationBySlug,
  requireOrgMember,
} from "@/features/organizations/server";

export async function listLearnerCertificates(userId: string, orgSlug: string) {
  const organization = await requireOrganizationBySlug(orgSlug);
  await requireOrgMember(organization.id, userId, "member");
  return db.certificate.findMany({
    where: { userId, organizationId: organization.id },
    orderBy: { completedAt: "desc" },
  });
}
