import { type Prisma, type PrismaClient } from "@scibly/db/client";
import { type SubscriptionPlan } from "@scibly/db/enums";

import { PLAN_CATALOGUE } from "./plan-catalogue";
import {
  mapPluginPlanToSubscriptionPlan,
  mapStripeStatusToSubscriptionStatus,
} from "./plan-mapping";

// Structural rather than the plugin's `Subscription` type, so the row read back by `stripeSubscriptionId` satisfies it too — Prisma types nullable columns `| null`, the plugin types them `| undefined`.
type SubscriptionSyncInput = {
  referenceId: string;
  plan: string;
  status: string;
  periodStart?: Date | null;
  periodEnd?: Date | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
};

// How much of the billing period the switch is being paid for — the same span Stripe prices its proration over.
const remainingPeriodFraction = (
  periodStart: Date,
  periodEnd: Date | null,
  now: Date,
): number => {
  if (!periodEnd) return 1;
  const period = periodEnd.getTime() - periodStart.getTime();
  if (period <= 0) return 1;
  const left = periodEnd.getTime() - now.getTime();
  return Math.min(1, Math.max(0, left / period));
};

// An upgrade is invoiced for the time left in the period, so the allowance rises by that same fraction of the difference between the two plans — the organization gets the generations it just paid for, added to what it has rather than replacing it, so what the old plan spent stays spent.
async function raiseAllowanceForUpgrade(
  tx: Prisma.TransactionClient,
  organizationId: string,
  from: SubscriptionPlan,
  to: SubscriptionPlan,
  remainingFraction: number,
): Promise<void> {
  const difference =
    PLAN_CATALOGUE[to].generations.amount -
    PLAN_CATALOGUE[from].generations.amount;

  const granted = Math.trunc(difference * remainingFraction);
  if (granted <= 0) return;

  await tx.organizationCredit.update({
    where: { organizationId },
    data: {
      allowanceRemaining: { increment: granted },

      notifiedAllowanceThreshold: 0,
    },
  });
}

// Projects the Stripe plugin's row into the domain tables the entitlement policies read; re-credits in full only when `periodStart` moves, and otherwise moves a plan switch's difference.
export async function syncSubscription(
  db: PrismaClient,
  subscription: SubscriptionSyncInput,
): Promise<void> {
  const organizationId = subscription.referenceId;
  const plan = mapPluginPlanToSubscriptionPlan(subscription.plan);
  const status = mapStripeStatusToSubscriptionStatus(subscription.status);
  const periodStart = subscription.periodStart ?? null;
  const periodEnd = subscription.periodEnd ?? null;

  await db.$transaction(async (tx) => {
    const credit = await tx.organizationCredit.findUnique({
      where: { organizationId },
      select: { periodStart: true },
    });
    if (!credit) {
      throw new Error(
        `Stripe sync: organization ${organizationId} has no credit row. Failing closed.`,
      );
    }

    const previous = await tx.organizationSubscription.findUnique({
      where: { organizationId },
      select: { plan: true },
    });

    const isNewPeriod =
      periodStart !== null &&
      periodStart.getTime() !== credit.periodStart.getTime();

    const isHeldDecrease =
      !isNewPeriod &&
      previous !== null &&
      PLAN_CATALOGUE[plan].monthlyPriceCents <
        PLAN_CATALOGUE[previous.plan].monthlyPriceCents;

    const effectivePlan = isHeldDecrease && previous ? previous.plan : plan;

    await tx.organizationSubscription.update({
      where: { organizationId },
      data: {
        plan: effectivePlan,
        status,

        pastDueSince: status === "PAST_DUE" ? undefined : null,

        purchasedLearnerSeats: status === "CANCELED" ? 0 : undefined,
        currentPeriodStart: periodStart ?? undefined,
        currentPeriodEnd: periodEnd,
        stripeCustomerId: subscription.stripeCustomerId ?? null,
        stripeSubscriptionId: subscription.stripeSubscriptionId ?? null,
      },
    });

    if (status === "PAST_DUE") {
      await tx.organizationSubscription.updateMany({
        where: { organizationId, pastDueSince: null },
        data: { pastDueSince: new Date() },
      });
    }

    if (!PLAN_CATALOGUE[effectivePlan].byoai || status === "CANCELED") {
      await tx.organization.updateMany({
        where: { id: organizationId, defaultChatModelId: { not: null } },
        data: { defaultChatModelId: null },
      });
      await tx.organizationAIModel.updateMany({
        where: { organizationId, type: "IMAGE", isActive: true },
        data: { isActive: false },
      });
    }

    if (isNewPeriod) {
      await tx.organizationCredit.update({
        where: { organizationId },
        data: {
          allowanceRemaining: PLAN_CATALOGUE[effectivePlan].generations.amount,

          notifiedAllowanceThreshold: 0,
          periodStart,
          periodEnd,
        },
      });
    } else if (previous && previous.plan !== effectivePlan) {
      await raiseAllowanceForUpgrade(
        tx,
        organizationId,
        previous.plan,
        effectivePlan,
        remainingPeriodFraction(credit.periodStart, periodEnd, new Date()),
      );
    }
  });
}
