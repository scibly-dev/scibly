import { AppError } from "@scibly/api/application-error";
import { hasLapsed } from "@scibly/api/entitlement";
import { db } from "@scibly/db";
import {
  MAX_SEAT_PURCHASE,
  PLAN_CATALOGUE,
} from "@scibly/ee-billing/plan-catalogue";
import {
  previewLearnerSeatPurchase,
  purchaseLearnerSeats,
} from "@scibly/ee-billing/seats";

import {
  BILLING_PURCHASES_PER_HOUR,
  type MaybeSeatAdjustableSubscription,
  requireBillingOwner,
  type SeatAdjustableSubscription,
  withBillingRateLimit,
} from "./subscription-preconditions";

export function isSeatPurchasable(
  subscription: MaybeSeatAdjustableSubscription | null,
): subscription is SeatAdjustableSubscription {
  if (!subscription?.stripeSubscriptionId) return false;
  if (PLAN_CATALOGUE[subscription.plan].extraLearnerSeatCents === null) {
    return false;
  }

  return !hasLapsed(subscription);
}

async function resolveSeatPurchase(params: {
  orgSlug: string;
  userId: string;
  quantity: number;
}) {
  const organizationId = await requireBillingOwner(
    params.orgSlug,
    params.userId,
  );

  if (
    !Number.isInteger(params.quantity) ||
    params.quantity < 1 ||
    params.quantity > MAX_SEAT_PURCHASE
  ) {
    throw new AppError({
      code: "BAD_REQUEST",
      applicationCode: "billing.seat_quantity_invalid",
      message: `Between 1 and ${MAX_SEAT_PURCHASE} seats can be bought at a time.`,
    });
  }

  const subscription = await db.organizationSubscription.findUnique({
    where: { organizationId },
    select: {
      plan: true,
      status: true,
      pastDueSince: true,
      stripeSubscriptionId: true,
    },
  });

  if (!isSeatPurchasable(subscription)) {
    throw new AppError({
      code: "FORBIDDEN",
      applicationCode: "billing.seats_unavailable",
      message:
        "Learner seats are sold to organizations on a paid plan. Choose a plan first.",
    });
  }

  return { organizationId, subscription };
}

export async function previewSeatPurchase(params: {
  orgSlug: string;
  userId: string;
  quantity: number;
}): Promise<{
  amountDueCents: number;
  recurringCents: number;
  seatsAfter: number;
  periodEnd: Date | null;
}> {
  const { subscription } = await resolveSeatPurchase(params);

  const preview = await previewLearnerSeatPurchase({
    plan: subscription.plan,
    stripeSubscriptionId: subscription.stripeSubscriptionId,
    quantity: params.quantity,
  });

  return {
    ...preview,
    recurringCents:
      preview.seatsAfter *
      (PLAN_CATALOGUE[subscription.plan].extraLearnerSeatCents ?? 0),
  };
}

export async function purchaseSeats(params: {
  orgSlug: string;
  userId: string;
  quantity: number;
}): Promise<{ purchasedSeats: number }> {
  const { organizationId, subscription } = await resolveSeatPurchase(params);

  return withBillingRateLimit(
    organizationId,
    "billing.purchaseLearnerSeats",
    BILLING_PURCHASES_PER_HOUR,
    () =>
      purchaseLearnerSeats({
        organizationId,
        plan: subscription.plan,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        quantity: params.quantity,
      }),
  );
}
