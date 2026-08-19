import type { MemberRole } from "@scibly/db";

import { AppError } from "@scibly/api/application-error";
import { db, toMemberRole } from "@scibly/db";

export type ActorContext = {
  userId: string;
};

export type TenantContext = {
  organizationId: string;
  membershipId: string;
  role: MemberRole;
};

type RequiredOrganizationRole = MemberRole | "admin_or_owner";

export async function requireOrganizationBySlug(orgSlug: string) {
  const organization = await db.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true },
  });
  if (!organization) {
    throw new AppError({
      code: "NOT_FOUND",
      applicationCode: "organization.not_found",
      message: "Organization not found.",
    });
  }
  return organization;
}

export async function requireTenantContext(
  organizationId: string,
  actor: ActorContext,
  requiredRole: RequiredOrganizationRole = "member",
): Promise<TenantContext> {
  const membership = await loadRequiredMembership(
    organizationId,
    actor,
    requiredRole,
  );
  return {
    organizationId,
    membershipId: membership.id,
    role: toMemberRole(membership.role),
  };
}

export async function resolveTenantContext(
  orgSlug: string,
  actor: ActorContext,
  requiredRole: RequiredOrganizationRole = "admin_or_owner",
) {
  const organization = await requireOrganizationBySlug(orgSlug);
  const tenant = await requireTenantContext(
    organization.id,
    actor,
    requiredRole,
  );
  return { organization, tenant };
}

export async function requireOrgMember(
  organizationId: string,
  userId: string,
  requiredRole: RequiredOrganizationRole = "member",
) {
  return loadRequiredMembership(organizationId, { userId }, requiredRole);
}

export async function resolveOrg(
  orgSlug: string,
  userId: string,
  requiredRole: RequiredOrganizationRole = "admin_or_owner",
) {
  const { organization, tenant } = await resolveTenantContext(
    orgSlug,
    { userId },
    requiredRole,
  );
  return {
    organization,
    membership: {
      id: tenant.membershipId,
      organizationId: tenant.organizationId,
      userId,
      role: tenant.role,
    },
  };
}

function assertOrganizationRole(
  membership: { role: string } | null,
  requiredRole: RequiredOrganizationRole,
): asserts membership is { role: string } {
  if (!membership) {
    throw new AppError({
      code: "FORBIDDEN",
      applicationCode: "organization.access_denied",
      message: "You do not have access to this organization.",
    });
  }

  if (
    requiredRole === "admin_or_owner" &&
    membership.role !== "admin" &&
    membership.role !== "owner"
  ) {
    throw new AppError({
      code: "FORBIDDEN",
      applicationCode: "organization.admin_required",
      message: "You must be an admin or owner to perform this action.",
    });
  }

  if (
    requiredRole !== "member" &&
    requiredRole !== "admin_or_owner" &&
    membership.role !== requiredRole
  ) {
    throw new AppError({
      code: "FORBIDDEN",
      applicationCode: "organization.role_required",
      message: `You must have the ${requiredRole} role to perform this action.`,
    });
  }
}

async function loadRequiredMembership(
  organizationId: string,
  actor: ActorContext,
  requiredRole: RequiredOrganizationRole,
) {
  const membership = await db.member.findFirst({
    where: { organizationId, userId: actor.userId },
  });
  assertOrganizationRole(membership, requiredRole);
  return membership;
}
