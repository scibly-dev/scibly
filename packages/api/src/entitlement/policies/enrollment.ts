import { type Prisma } from "@scibly/db/client";

import { type Decision } from "../decision";
import { resolveSubscribedPlan } from "../policy";
import {
  countBillableLearners,
  learnerSeatCapacity,
  readEnrolledAmong,
} from "../seats";
import { type GateDecision, requiredPlanFor } from "./plan-requirement";

// An empty candidate list can only ever hit the lapse refusal, so it skips the usage read entirely.
export const decideEnrollment = async (
  db: Prisma.TransactionClient,
  organizationId: string,
  { candidateUserIds }: { candidateUserIds: string[] },
): Promise<
  Decision<{
    seats: number;
    used: number;
    purchased: number;
    requiredPlan: string | null;
  }>
> => {
  const { plan, subscription, lapsed } = await resolveSubscribedPlan(
    db,
    organizationId,
  );
  const seats = learnerSeatCapacity(plan, subscription);
  const purchased = subscription.purchasedLearnerSeats;
  const requiredPlan = requiredPlanFor(
    (limits) => limits.includedLearnerSeats > 0,
  );

  if (lapsed) {
    return {
      seats,
      used: 0,
      purchased,
      requiredPlan,
      refusal: {
        applicationCode: "entitlement.enroll_requires_subscription",
        message:
          "This organization's subscription has lapsed, so learners can no longer be enrolled. Reactivate the subscription to enroll again — courses already assigned keep running.",
        details: { reason: "lapsed" },
      },
    };
  }

  if (candidateUserIds.length === 0) {
    return { seats, used: 0, purchased, requiredPlan, refusal: null };
  }

  const used = await countBillableLearners(db, organizationId);
  const alreadyEnrolled = await readEnrolledAmong(
    db,
    organizationId,
    candidateUserIds,
  );
  const newcomers = new Set(
    candidateUserIds.filter((userId) => !alreadyEnrolled.has(userId)),
  );
  const requested = newcomers.size;
  const remaining = Math.max(0, seats - used);

  if (requested > remaining) {
    const shortfall = requested - remaining;
    return {
      seats,
      used,
      purchased,
      requiredPlan,
      refusal: {
        applicationCode: "entitlement.seats_exhausted",
        message:
          seats === 0
            ? "This organization's plan includes no learner seats, so nobody can be enrolled yet. Subscribe to a plan to enroll learners — building and previewing courses stays open either way."
            : shortfall === 1
              ? "Enrolling these people needs 1 more learner seat than the organization has. Purchase 1 additional seat and retry."
              : `Enrolling these people needs ${shortfall} more learner seats than the organization has. Purchase ${shortfall} additional seats and retry.`,
        details: { shortfall, remainingSeats: remaining },
      },
    };
  }

  return { seats, used, purchased, requiredPlan, refusal: null };
};

// `decideEnrollment` asked with no candidates, so a paying organization's answer falls through to "any seats at all".
export const describeEnrollmentAccess = async (
  db: Prisma.TransactionClient,
  organizationId: string,
): Promise<GateDecision> => {
  const decision = await decideEnrollment(db, organizationId, {
    candidateUserIds: [],
  });
  if (decision.refusal) {
    return {
      allowed: false,
      reason: "lapsed",
      requiredPlan: decision.requiredPlan,
    };
  }
  return {
    allowed: decision.seats > 0,
    reason: decision.seats > 0 ? null : "not_in_plan",
    requiredPlan: decision.requiredPlan,
  };
};
