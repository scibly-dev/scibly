import { AppError } from "@scibly/api/application-error";
import { protectedProcedure } from "@scibly/api/trpc";
import { auth } from "@scibly/auth/config";
import { db } from "@scibly/db";

import {
  acceptInvitationSchema,
  inviteMembersSchema,
  listInvitationsSchema,
  rejectInvitationSchema,
} from "./organization.schema";

export const organizationInvitationProcedures = {
  listInvitations: protectedProcedure
    .input(listInvitationsSchema)
    .query(async ({ input, ctx }) => {
      const membership = await db.member.findFirst({
        where: {
          organizationId: input.organizationId,
          userId: ctx.session.user.id,
        },
      });
      if (
        !membership ||
        (membership.role !== "admin" && membership.role !== "owner")
      ) {
        throw new AppError({
          code: "FORBIDDEN",
          applicationCode: "api.forbidden",
          message: "You do not have permission to view invitations.",
        });
      }
      return db.invitation.findMany({
        where: {
          organizationId: input.organizationId,
          status: "pending",
        },
        orderBy: { expiresAt: "asc" },
      });
    }),

  listUserInvitations: protectedProcedure.query(async ({ ctx }) => {
    const invitations = await ctx.db.invitation.findMany({
      where: {
        email: ctx.session.user.email,
        status: "pending",
      },
      include: {
        organization: { select: { name: true, slug: true } },
        user: { select: { email: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    const now = new Date();
    return invitations.map(({ organization, user, ...invitation }) => ({
      ...invitation,

      isExpired: invitation.expiresAt < now,
      organizationName: organization.name,
      organizationSlug: organization.slug,
      inviterName: user.name,
      inviterEmail: user.email,
    }));
  }),

  inviteMembers: protectedProcedure
    .input(inviteMembersSchema)
    .mutation(async ({ input, ctx }) =>
      Promise.all(
        input.invites.map(async (invite) => {
          try {
            await auth.api.createInvitation({
              body: {
                email: invite.email,
                role: invite.role,
                organizationId: input.organizationId,
              },
              headers: ctx.headers,
            });
            return { email: invite.email, success: true, error: null };
          } catch (error) {
            return {
              email: invite.email,
              success: false,
              error:
                error instanceof Error ? error.message : "Failed to invite",
            };
          }
        }),
      ),
    ),

  acceptInvitation: protectedProcedure
    .input(acceptInvitationSchema)
    .mutation(async ({ input, ctx }) => {
      const result = await auth.api.acceptInvitation({
        body: { invitationId: input.invitationId },
        headers: ctx.headers,
      });
      // Joiners never see the plans step — the organization they joined is
      // already owned and paid for by someone else. Best-effort: the invite is
      // already accepted, so a failure here shouldn't fail the request —
      // resolveOnboardingState falls back to membership anyway.
      try {
        await db.user.update({
          where: { id: ctx.session.user.id },
          data: { onboardingStep: "COMPLETED" },
        });
      } catch (error) {
        console.error(
          "[onboarding] Failed to mark onboarding complete after accepting invitation:",
          error,
        );
      }
      return result;
    }),

  rejectInvitation: protectedProcedure
    .input(rejectInvitationSchema)
    .mutation(({ input, ctx }) =>
      auth.api.rejectInvitation({
        body: { invitationId: input.invitationId },
        headers: ctx.headers,
      }),
    ),
};
