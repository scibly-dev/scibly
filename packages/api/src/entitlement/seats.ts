import { Prisma } from "@scibly/db/client";
import { type PlanLimits } from "@scibly/db/plan-catalogue";
import { PLAN_CATALOGUE } from "@scibly/ee-billing/plan-catalogue";

import { type ResolvedSubscription } from "./policy";

// Counted in Postgres over the denormalised `organizationId`, never a join through courses or a row per learner in memory.
export const countBillableLearners = async (
  db: Prisma.TransactionClient,
  organizationId: string,
): Promise<number> => {
  const [row] = await db.$queryRaw<{ count: number }[]>(Prisma.sql`
    SELECT COUNT(DISTINCT "userId")::int AS count
    FROM "course_enrollment"
    WHERE "organizationId" = ${organizationId} AND "userId" IS NOT NULL
  `);
  return row?.count ?? 0;
};

// Scoped to the candidates so the result is bounded by the request, not by how large the customer has grown.
export const readEnrolledAmong = async (
  db: Prisma.TransactionClient,
  organizationId: string,
  candidateUserIds: string[],
): Promise<Set<string>> => {
  const enrolled = await db.courseEnrollment.findMany({
    where: { organizationId, userId: { in: candidateUserIds } },
    distinct: ["userId"],
    select: { userId: true },
  });
  return new Set(enrolled.flatMap((row) => (row.userId ? [row.userId] : [])));
};

// Written once here since both the cap and the billing page need this number.
export const learnerSeatCapacity = (
  plan: PlanLimits,
  subscription: Pick<ResolvedSubscription, "purchasedLearnerSeats">,
): number => plan.includedLearnerSeats + subscription.purchasedLearnerSeats;

export type LearnerSeatUsage = {
  used: number;
  capacity: number;
  included: number;
  purchased: number;
};

// Reports unknown rather than zero when unresolvable — a policy that grants something must fail closed, but a display doesn't have to.
export const readLearnerSeatUsage = async (
  db: Prisma.TransactionClient,
  organizationId: string,
): Promise<LearnerSeatUsage | null> => {
  const subscription = await db.organizationSubscription.findUnique({
    where: { organizationId },
    select: { plan: true, purchasedLearnerSeats: true },
  });
  const plan = subscription ? PLAN_CATALOGUE[subscription.plan] : undefined;
  if (!subscription || !plan) return null;

  return {
    used: await countBillableLearners(db, organizationId),
    capacity: learnerSeatCapacity(plan, subscription),
    included: plan.includedLearnerSeats,
    purchased: subscription.purchasedLearnerSeats,
  };
};
