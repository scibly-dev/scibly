import { type Prisma, type PrismaClient } from "@scibly/db/client";
import { type SubscriptionStatus } from "@scibly/db/enums";
import {
  PAYMENT_GRACE_DAYS,
  PLAN_CATALOGUE,
} from "@scibly/ee-billing/plan-catalogue";

import { AppError } from "../application-error";
import { TimeHelpers } from "../rate-limit";

// `Client` defaults to the full PrismaClient since a consumable opens its own transaction; a cap takes a TransactionClient instead.
export type EntitlementContext<Client = PrismaClient> = {
  db: Client;
  organizationId: string;

  actorId: string | null;
};

export const unresolvable = (organizationId: string, what: string) =>
  new AppError({
    code: "INTERNAL_SERVER_ERROR",
    applicationCode: "entitlement.unresolvable",
    message: `Entitlement for organization ${organizationId} could not be resolved: ${what}. Failing closed.`,
  });

type LapseFacts = {
  status: SubscriptionStatus;
  pastDueSince: Date | null;
};

// A PAST_DUE row with no clock is treated as in grace — withdrawing a paying customer's features over our own missing data is worse than refusing late.
export const hasLapsed = (
  subscription: LapseFacts,
  now: Date = new Date(),
): boolean => {
  if (subscription.status === "CANCELED") return true;
  if (subscription.status !== "PAST_DUE") return false;
  if (!subscription.pastDueSince) return false;
  return now.getTime() >= graceEndsAt(subscription.pastDueSince).getTime();
};

// The moment a lapse stops being recoverable without consequence — the date the warning banner names.
export const graceEndsAt = (pastDueSince: Date): Date =>
  new Date(pastDueSince.getTime() + PAYMENT_GRACE_DAYS * TimeHelpers.IN_MS.DAY);

// `hasLapsed` negated as a Prisma filter, kept beside the predicate it mirrors so the two can't disagree.
export const notLapsedSubscription = (
  now: Date = new Date(),
): Prisma.OrganizationSubscriptionWhereInput => ({
  OR: [
    { status: "ACTIVE" },

    {
      status: "PAST_DUE",
      OR: [
        { pastDueSince: null },
        {
          pastDueSince: {
            gt: new Date(
              now.getTime() - PAYMENT_GRACE_DAYS * TimeHelpers.IN_MS.DAY,
            ),
          },
        },
      ],
    },
  ],
});

// Throws a loud fail-closed refusal rather than defaulting to permitted when the subscription can't be resolved.
export const resolveSubscribedPlan = async (
  db: Prisma.TransactionClient,
  organizationId: string,
) => {
  const subscription = await db.organizationSubscription.findUnique({
    where: { organizationId },
    select: {
      plan: true,
      purchasedLearnerSeats: true,
      status: true,
      pastDueSince: true,
      currentPeriodStart: true,
    },
  });
  if (!subscription) {
    throw unresolvable(organizationId, "no subscription");
  }
  const plan = PLAN_CATALOGUE[subscription.plan];
  if (!plan) {
    throw unresolvable(organizationId, `unknown plan ${subscription.plan}`);
  }

  return { plan, subscription, lapsed: hasLapsed(subscription) };
};

export type ResolvedPlan = Awaited<ReturnType<typeof resolveSubscribedPlan>>;

/**
 * Unlike `resolveSubscribedPlan`, this cannot fail closed by throwing: one
 * unresolvable organization would abort a sweep over hundreds. It is absent
 * from the map instead, which every caller reads as "not entitled".
 */
export const resolveSubscribedPlans = async (
  db: Prisma.TransactionClient,
  organizationIds: string[],
): Promise<Map<string, ResolvedPlan>> => {
  if (organizationIds.length === 0) return new Map();
  const subscriptions = await db.organizationSubscription.findMany({
    where: { organizationId: { in: organizationIds } },
    select: {
      organizationId: true,
      plan: true,
      purchasedLearnerSeats: true,
      status: true,
      pastDueSince: true,
      currentPeriodStart: true,
    },
  });

  const resolved = new Map<string, ResolvedPlan>();
  for (const { organizationId, ...subscription } of subscriptions) {
    const plan = PLAN_CATALOGUE[subscription.plan];
    if (!plan) continue;
    resolved.set(organizationId, {
      plan,
      subscription,
      lapsed: hasLapsed(subscription),
    });
  }
  return resolved;
};


export type ResolvedSubscription = ResolvedPlan["subscription"];

type PaymentState = {
  state: "current" | "grace" | "lapsed";

  graceEndsAt: Date | null;
};

// `hasLapsed` with the middle state named, so the banner can't promise days the policies have already taken.
export const describePaymentState = (
  subscription: LapseFacts,
  now: Date = new Date(),
): PaymentState => {
  if (hasLapsed(subscription, now))
    return { state: "lapsed", graceEndsAt: null };
  if (subscription.status !== "PAST_DUE" || !subscription.pastDueSince) {
    return { state: "current", graceEndsAt: null };
  }
  return {
    state: "grace",
    graceEndsAt: graceEndsAt(subscription.pastDueSince),
  };
};
