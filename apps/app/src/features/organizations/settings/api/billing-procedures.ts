import {
  describeByoaiAccess,
  describeCoursePublishingAccess,
  describeEnrollmentAccess,
  describePaymentState,
} from "@scibly/api/entitlement";
import { protectedProcedure } from "@scibly/api/trpc";
import { db } from "@scibly/db";
import { PLAN_CATALOGUE } from "@scibly/ee-billing/plan-catalogue";
import { TOPUP_PACK_KEYS } from "@scibly/ee-billing/topup-catalogue";
import {
  isSeatPurchasable,
  previewSeatPurchase,
  purchaseSeats,
} from "@scibly/ee-organizations-billing/api/seat-purchase.operations";
import {
  claimTopupPurchase,
  isTopupSellable,
  startTopupCheckout,
} from "@scibly/ee-organizations-billing/api/topup.operations";
import { readBillingUsageOverview } from "@scibly/ee-organizations-billing/api/usage-overview.operations";
import { z } from "zod";

import {
  requireOrganizationBySlug,
  requireOrgMember,
} from "../../server/policy";
import { readAllowanceWarningForOrg } from "./allowance-warning.operations";
import { readGenerationBalance } from "./generation-balance.operations";
import { orgSlugInput } from "./org-ai-config.schemas";

export const billingProcedures = {
  getStatus: protectedProcedure
    .input(orgSlugInput)
    .query(async ({ input, ctx }) => {
      const { id: orgId } = await requireOrganizationBySlug(input.orgSlug);
      const [membership, subscription] = await Promise.all([
        requireOrgMember(orgId, ctx.session.user.id),
        db.organizationSubscription.findUnique({
          where: { organizationId: orgId },
          select: {
            plan: true,
            status: true,
            pastDueSince: true,
            stripeCustomerId: true,
            stripeSubscriptionId: true,
          },
        }),
      ]);
      return {
        plan: subscription?.plan ?? null,
        status: subscription?.status ?? null,

        payment: subscription ? describePaymentState(subscription) : null,

        hasStripeCustomer: subscription?.stripeCustomerId != null,

        topupSellable: isTopupSellable(subscription ?? null),

        seatsSellable: isSeatPurchasable(subscription ?? null),
        extraSeatPriceCents: subscription
          ? PLAN_CATALOGUE[subscription.plan].extraLearnerSeatCents
          : null,
        canManageBilling: membership.role === "owner",
      };
    }),

  getFeatureAccess: protectedProcedure
    .input(orgSlugInput)
    .query(async ({ input, ctx }) => {
      const { id: orgId } = await requireOrganizationBySlug(input.orgSlug);

      await requireOrgMember(orgId, ctx.session.user.id);
      const [byoai, publish, enroll] = await Promise.all([
        describeByoaiAccess(db, orgId),
        describeCoursePublishingAccess(db, orgId),
        describeEnrollmentAccess(db, orgId),
      ]);
      return { byoai, publish, enroll };
    }),

  getGenerationBalance: protectedProcedure
    .input(orgSlugInput)
    .query(({ input, ctx }) =>
      readGenerationBalance(input.orgSlug, ctx.session.user.id),
    ),

  getAllowanceWarning: protectedProcedure
    .input(orgSlugInput)
    .query(({ input, ctx }) =>
      readAllowanceWarningForOrg(input.orgSlug, ctx.session.user.id),
    ),

  getUsageOverview: protectedProcedure
    .input(orgSlugInput)
    .query(({ input, ctx }) =>
      readBillingUsageOverview(input.orgSlug, ctx.session.user.id),
    ),

  startTopupCheckout: protectedProcedure
    .input(orgSlugInput.extend({ pack: z.enum(TOPUP_PACK_KEYS) }))
    .mutation(({ input, ctx }) =>
      startTopupCheckout({
        orgSlug: input.orgSlug,
        userId: ctx.session.user.id,
        pack: input.pack,
      }),
    ),

  previewLearnerSeats: protectedProcedure
    .input(orgSlugInput.extend({ quantity: z.number().int() }))
    .query(({ input, ctx }) =>
      previewSeatPurchase({
        orgSlug: input.orgSlug,
        userId: ctx.session.user.id,
        quantity: input.quantity,
      }),
    ),

  purchaseLearnerSeats: protectedProcedure
    .input(orgSlugInput.extend({ quantity: z.number().int() }))
    .mutation(({ input, ctx }) =>
      purchaseSeats({
        orgSlug: input.orgSlug,
        userId: ctx.session.user.id,
        quantity: input.quantity,
      }),
    ),

  claimTopupPurchase: protectedProcedure
    .input(orgSlugInput.extend({ sessionId: z.string().min(1) }))
    .mutation(({ input, ctx }) =>
      claimTopupPurchase({
        orgSlug: input.orgSlug,
        userId: ctx.session.user.id,
        sessionId: input.sessionId,
      }),
    ),
};
