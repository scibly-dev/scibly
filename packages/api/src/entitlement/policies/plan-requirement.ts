import { type SubscriptionPlan } from "@scibly/db/enums";
import { type PlanLimits } from "@scibly/db/plan-catalogue";
import {
  PLAN_CATALOGUE,
  SELLABLE_PLANS,
} from "@scibly/ee-billing/plan-catalogue";

export type GateRefusalReason = "not_in_plan" | "lapsed";

// Asked by a surface to decide what to offer, and by the enforcement to decide what to refuse, so the two can never disagree.
export type GateDecision = {
  allowed: boolean;
  reason: GateRefusalReason | null;
  requiredPlan: string | null;
};

const cheapestPlanIncluding = (
  includedIn: (plan: PlanLimits) => boolean,
): SubscriptionPlan | null =>
  SELLABLE_PLANS.find(({ plan }) => includedIn(PLAN_CATALOGUE[plan]))?.plan ??
  null;

// `BUSINESS` as the customer reads it on the pricing page.
const planDisplayName = (plan: SubscriptionPlan): string =>
  plan.charAt(0) + plan.slice(1).toLowerCase();

// Exported so a surface asking about a limit no gate guards (learner seats) names its tier the same way a gate does.
export const requiredPlanFor = (
  includedIn: (plan: PlanLimits) => boolean,
): string | null => {
  const plan = cheapestPlanIncluding(includedIn);
  return plan && planDisplayName(plan);
};
