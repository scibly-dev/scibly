// Unreachable rather than a bypass flag, so internal organizations hit the same enforcement paths as customers; must fit a Postgres INTEGER (max 2,147,483,647).
export const EFFECTIVELY_UNLIMITED = 1_000_000_000;

// The plan names better-auth's Stripe plugin uses (it lower-cases `StripePlan.name`); a closed set, so a priced plan missing a plugin key is a compile error.
export type StripePlanKey = "starter" | "business" | "pro";

export type PlanLimits = {
  monthlyPriceCents: number;

  stripePlanKey: StripePlanKey | null;

  generations: {
    amount: number;

    renews: boolean;
  };
  includedLearnerSeats: number;

  extraLearnerSeatCents: number | null;
  sourcesPerNotebook: number;

  byoai: boolean;

  publishAndEnroll: boolean;

  publicCourses: number;

  anonymousSessionsPerPeriod: number;

  adFreePublicCourses: boolean;
};

// The two plans core code provisions directly (TRIAL on signup, INTERNAL for staff/seed orgs) without going through ee/billing. ee/billing's PLAN_CATALOGUE spreads these in rather than redefining them, so there's one definition per plan regardless of which package needs it.
export const CORE_PLANS = {
  TRIAL: {
    monthlyPriceCents: 0,
    stripePlanKey: null,
    generations: { amount: 100, renews: false },
    includedLearnerSeats: 0,
    extraLearnerSeatCents: null,
    sourcesPerNotebook: 10,
    byoai: false,
    publishAndEnroll: true,
    publicCourses: 200,
    anonymousSessionsPerPeriod: 10_000,
    adFreePublicCourses: false,
  },
  INTERNAL: {
    monthlyPriceCents: 0,
    stripePlanKey: null,
    generations: { amount: EFFECTIVELY_UNLIMITED, renews: true },
    includedLearnerSeats: EFFECTIVELY_UNLIMITED,
    extraLearnerSeatCents: null,
    sourcesPerNotebook: EFFECTIVELY_UNLIMITED,
    byoai: true,
    publishAndEnroll: true,
    publicCourses: EFFECTIVELY_UNLIMITED,
    anonymousSessionsPerPeriod: EFFECTIVELY_UNLIMITED,
    adFreePublicCourses: false,
  },
} as const satisfies Record<"TRIAL" | "INTERNAL", PlanLimits>;
