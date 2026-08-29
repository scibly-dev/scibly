import { SubscriptionPlan } from "@scibly/db/enums";
import {
  CORE_PLANS,
  type PlanLimits,
  type StripePlanKey,
} from "@scibly/db/plan-catalogue";

export const PLAN_CATALOGUE = {
  [SubscriptionPlan.TRIAL]: CORE_PLANS.TRIAL,
  [SubscriptionPlan.INTERNAL]: CORE_PLANS.INTERNAL,
  [SubscriptionPlan.STARTER]: {
    monthlyPriceCents: 9_900,
    stripePlanKey: "starter",
    generations: { amount: 1_000, renews: true },
    includedLearnerSeats: 50,
    extraLearnerSeatCents: 200,
    sourcesPerNotebook: 10,
    byoai: false,
    knowledgeSync: false,
    publishAndEnroll: true,
    publicCourses: 200,
    anonymousSessionsPerPeriod: 10_000,
    adFreePublicCourses: true,
  },
  [SubscriptionPlan.BUSINESS]: {
    monthlyPriceCents: 29_900,
    stripePlanKey: "business",
    generations: { amount: 5_000, renews: true },
    includedLearnerSeats: 200,
    extraLearnerSeatCents: 150,
    sourcesPerNotebook: 50,
    byoai: true,
    knowledgeSync: true,
    publishAndEnroll: true,
    publicCourses: 200,
    anonymousSessionsPerPeriod: 10_000,
    adFreePublicCourses: true,
  },
  [SubscriptionPlan.PRO]: {
    monthlyPriceCents: 49_900,
    stripePlanKey: "pro",
    generations: { amount: 15_000, renews: true },
    includedLearnerSeats: 500,
    extraLearnerSeatCents: 100,
    sourcesPerNotebook: 100,
    byoai: true,
    knowledgeSync: true,
    publishAndEnroll: true,
    publicCourses: 200,
    anonymousSessionsPerPeriod: 10_000,
    adFreePublicCourses: true,
  },
} as const satisfies Record<SubscriptionPlan, PlanLimits>;

type SellablePlan = {
  plan: SubscriptionPlan;
  key: StripePlanKey;
  monthlyPriceCents: number;
};

// Plans on sale, cheapest first — derived from which plans cost money rather than a separately maintained list.
export const SELLABLE_PLANS: readonly SellablePlan[] = Object.values(
  SubscriptionPlan,
)
  .map((plan) => ({ plan, limits: PLAN_CATALOGUE[plan] }))
  .filter(({ limits }) => limits.monthlyPriceCents > 0)
  .map(({ plan, limits }) => {
    if (limits.stripePlanKey === null) {
      throw new Error(`Plan ${plan} is priced but has no Stripe plan key.`);
    }
    return {
      plan,
      key: limits.stripePlanKey,
      monthlyPriceCents: limits.monthlyPriceCents,
    };
  })
  .sort((a, b) => a.monthlyPriceCents - b.monthlyPriceCents);

// The deployment's subscription price ids, under the environment variable names they are configured with.
type StripePriceEnv = {
  STRIPE_PRICE_STARTER: string;
  STRIPE_PRICE_BUSINESS: string;
  STRIPE_PRICE_PRO: string;
};

// Takes the environment rather than reading it, since the app's Stripe plugin and the portal script load env differently and both must see the same prices.
export function priceIdByPlanKey(env: StripePriceEnv) {
  return {
    starter: env.STRIPE_PRICE_STARTER,
    business: env.STRIPE_PRICE_BUSINESS,
    pro: env.STRIPE_PRICE_PRO,
  } satisfies Record<StripePlanKey, string>;
}

// Whether the plan can be charged for anything beyond it (top-ups, extra seats) — a free plan is upgraded, not topped up.
export function isPlanSellable(plan: SubscriptionPlan): boolean {
  return PLAN_CATALOGUE[plan].monthlyPriceCents > 0;
}

// Ceiling on one seat purchase; the quantity arrives from a URL, so a mistyped 100 for 10 must not become a recurring charge.
export const MAX_SEAT_PURCHASE = 1_000;

// Days a failed payment keeps full function before access is cut.
export const PAYMENT_GRACE_DAYS = 14;
