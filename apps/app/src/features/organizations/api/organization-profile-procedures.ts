import { AppError } from "@scibly/api/application-error";
import { protectedProcedure } from "@scibly/api/trpc";
import { auth } from "@scibly/auth/config";
import { db, toMemberRole } from "@scibly/db";
import {
  createOrganizationSchema,
  updateOrganizationSchema,
} from "@scibly/schemas/organization";

import {
  deleteOrganizationSchema,
  getOrganizationBySlugSchema,
} from "./organization.schema";

function requireResult<T>(result: T | null, message: string): T {
  if (result) return result;
  throw new AppError({
    code: "INTERNAL_SERVER_ERROR",
    applicationCode: "api.internal_server_error",
    message,
  });
}

export const organizationProfileProcedures = {
  update: protectedProcedure
    .input(updateOrganizationSchema)
    .mutation(async ({ input, ctx }) => {
      const result = await auth.api.updateOrganization({
        headers: ctx.headers,
        body: {
          organizationId: input.organizationId,
          data: {
            name: input.name,
            slug: input.slug,
            logo: input.logo,
          },
        },
      });
      return requireResult(result, "Failed to update organization.");
    }),

  delete: protectedProcedure
    .input(deleteOrganizationSchema)
    .mutation(async ({ input, ctx }) => {
      const result = await auth.api.deleteOrganization({
        headers: ctx.headers,
        body: { organizationId: input.organizationId },
      });
      return requireResult(result, "Failed to delete organization.");
    }),

  create: protectedProcedure
    .input(createOrganizationSchema)
    .mutation(async ({ input, ctx }) => {
      const existingSlug = await db.organization.findUnique({
        where: { slug: input.slug },
        select: { id: true },
      });
      if (existingSlug) {
        throw new AppError({
          code: "CONFLICT",
          applicationCode: "api.conflict",
          message: "This slug is already taken. Please choose another.",
        });
      }
      const result = await auth.api.createOrganization({
        body: {
          name: input.name,
          slug: input.slug,
          logo: input.logo,
          userId: ctx.session.user.id,
        },
      });
      if (!result) {
        throw new AppError({
          code: "INTERNAL_SERVER_ERROR",
          applicationCode: "organization.create_failed",
          message: "Failed to create organization.",
        });
      }
      // Onboarding moves on to the trial credits and plans it just granted.
      // Best-effort: the org already exists, so a failure here shouldn't fail
      // the request — resolveOnboardingState falls back to membership anyway.
      try {
        await db.user.update({
          where: { id: ctx.session.user.id },
          data: { onboardingStep: "PLANS" },
        });
      } catch (error) {
        console.error(
          "[onboarding] Failed to advance onboarding step to PLANS after org creation:",
          error,
        );
      }
      return result;
    }),

  getBySlug: protectedProcedure
    .input(getOrganizationBySlugSchema)
    .query(async ({ input, ctx }) => {
      const member = await db.member.findFirst({
        where: {
          userId: ctx.session.user.id,
          organization: { slug: input.slug },
        },
        include: { organization: true },
      });
      if (!member) {
        throw new AppError({
          code: "NOT_FOUND",
          applicationCode: "api.not_found",
          message: "Organization not found or you do not have access.",
        });
      }
      return member.organization;
    }),

  getMine: protectedProcedure.query(async ({ ctx }) => {
    const member = await db.member.findFirst({
      where: { userId: ctx.session.user.id },
      include: { organization: true },
      orderBy: { createdAt: "asc" },
    });
    return member?.organization ?? null;
  }),

  listMyOrgs: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await db.member.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        organization: {
          include: { _count: { select: { members: true } } },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    return memberships.map((membership) => ({
      id: membership.organization.id,
      name: membership.organization.name,
      slug: membership.organization.slug,
      logo: membership.organization.logo,
      createdAt: membership.organization.createdAt,
      role: toMemberRole(membership.role),
      memberCount: membership.organization._count.members,
    }));
  }),
};
