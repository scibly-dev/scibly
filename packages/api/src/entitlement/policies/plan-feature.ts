import { type Prisma } from "@scibly/db/client";
import { type PlanLimits } from "@scibly/db/plan-catalogue";

import { type Decision } from "../decision";
import { type ResolvedPlan, resolveSubscribedPlan } from "../policy";
import {
  type GateDecision,
  type GateRefusalReason,
  requiredPlanFor,
} from "./plan-requirement";

// Several gates ask the same question — does the tier include the feature, is the subscription paid — so the rule is written once here.
export type PlanFeature = {
  includedIn: (limits: PlanLimits) => boolean;
  applicationCode: string;

  whenLapsed: string | null;
  whenNotInPlan: (requiredPlan: string | null) => string;
};

type FeatureDecision = Decision<{
  reason: GateRefusalReason | null;
  requiredPlan: string | null;
}>;

// Takes an already-resolved subscription so two gates on one turn share a query instead of repeating it.
export const judgePlanFeature = (
  { plan, lapsed }: ResolvedPlan,
  feature: PlanFeature,
): FeatureDecision => {
  const requiredPlan = requiredPlanFor(feature.includedIn);
  const reason: GateRefusalReason | null = !feature.includedIn(plan)
    ? "not_in_plan"
    : lapsed && feature.whenLapsed
      ? "lapsed"
      : null;

  if (reason === null) return { reason, requiredPlan, refusal: null };

  return {
    reason,
    requiredPlan,
    refusal: {
      applicationCode: feature.applicationCode,
      message:
        reason === "lapsed"
          ? feature.whenLapsed!
          : feature.whenNotInPlan(requiredPlan),
      details: { reason, requiredPlan },
    },
  };
};

export const decidePlanFeature = async (
  db: Prisma.TransactionClient,
  organizationId: string,
  feature: PlanFeature,
): Promise<FeatureDecision> =>
  judgePlanFeature(await resolveSubscribedPlan(db, organizationId), feature);

// Kept here rather than repeated beside each `describe*` so an affordance can't disagree with the refusal it predicts.
export const toGateDecision = (decision: FeatureDecision): GateDecision => ({
  allowed: !decision.refusal,
  reason: decision.reason,
  requiredPlan: decision.requiredPlan,
});
