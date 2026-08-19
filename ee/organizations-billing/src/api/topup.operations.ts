import { AppError } from "@scibly/api/application-error";
import { hasLapsed } from "@scibly/api/entitlement";
import { db } from "@scibly/db";
import { isPlanSellable } from "@scibly/ee-billing/plan-catalogue";
import {
  claimTopupCheckout,
  createTopupCheckoutSession,
} from "@scibly/ee-billing/topup";
import { type TopupPackKey } from "@scibly/ee-billing/topup-catalogue";
import { routes } from "@scibly/routes";

import {
  type BillableSubscription,
  BILLING_CLAIMS_PER_HOUR,
  BILLING_PURCHASES_PER_HOUR,
  type MaybeBillableSubscription,
  requireBillingOwner,
  withBillingRateLimit,
} from "./subscription-preconditions";

export function isTopupSellable(
  subscription: MaybeBillableSubscription | null,
): subscription is BillableSubscription {
  if (!subscription?.stripeCustomerId) return false;
  if (!isPlanSellable(subscription.plan)) return false;
  return !hasLapsed(subscription);
}

export async function startTopupCheckout(params: {
  orgSlug: string;
  userId: string;
  pack: TopupPackKey;
}): Promise<{ url: string }> {
  const organizationId = await requireBillingOwner(
    params.orgSlug,
    params.userId,
  );
  const subscription = await db.organizationSubscription.findUnique({
    where: { organizationId },
    select: {
      plan: true,
      status: true,
      pastDueSince: true,
      stripeCustomerId: true,
    },
  });

  if (!isTopupSellable(subscription)) {
    throw new AppError({
      code: "FORBIDDEN",
      applicationCode: "billing.topup_unavailable",
      message:
        "Top-up packs are sold to organizations on a paid plan. Choose a plan first.",
    });
  }

  const url = await withBillingRateLimit(
    organizationId,
    "billing.startTopupCheckout",
    BILLING_PURCHASES_PER_HOUR,
    () =>
      createTopupCheckoutSession({
        organizationId,
        buyerId: params.userId,
        pack: params.pack,
        stripeCustomerId: subscription.stripeCustomerId,
        returnUrl: routes.app.profile.org(params.orgSlug).billing,
      }),
  );
  return { url };
}

export async function claimTopupPurchase(params: {
  orgSlug: string;
  userId: string;
  sessionId: string;
}): Promise<{ granted: boolean }> {
  const organizationId = await requireBillingOwner(
    params.orgSlug,
    params.userId,
  );
  const outcome = await withBillingRateLimit(
    organizationId,
    "billing.claimTopupPurchase",
    BILLING_CLAIMS_PER_HOUR,
    () => claimTopupCheckout({ sessionId: params.sessionId, organizationId }),
  );

  return { granted: outcome.status !== "ignored" };
}
