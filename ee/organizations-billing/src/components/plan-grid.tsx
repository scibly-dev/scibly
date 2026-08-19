"use client";

import type { OrgBillingPage } from "../i18n/org-billing.types";
import type { PlanCardCopy } from "./plan-card";

import { authClient } from "@scibly/auth/client";
import { type PlanLimits, type StripePlanKey } from "@scibly/db/plan-catalogue";
import {
  PLAN_CATALOGUE,
  SELLABLE_PLANS,
} from "@scibly/ee-billing/plan-catalogue";
import { usePostHog } from "@scibly/observability/client";
import { PLAN_CHECKOUT_QUERY_PARAM } from "@scibly/routes";
import { useState } from "react";
import { toast } from "sonner";

import { formatCount } from "../format-count";
import { PlanCard } from "./plan-card";

function resolvePlanCopy(
  copy: PlanCardCopy,
  limits: PlanLimits,
  lang: string,
): PlanCardCopy {
  const n = formatCount(lang);
  return {
    ...copy,
    price: copy.price.replace("{price}", n(limits.monthlyPriceCents / 100)),
    credits: copy.credits.replace("{credits}", n(limits.generations.amount)),
    seats: copy.seats.replace("{seats}", n(limits.includedLearnerSeats)),
    sources: copy.sources.replace("{sources}", n(limits.sourcesPerNotebook)),
  };
}

/** The plans on sale and their checkout, wherever an upgrade is offered. */
export function PlanGrid({
  orgId,
  lang,
  t,
  returnUrl,
  beforeCheckout,
}: {
  orgId: string;
  lang: string;
  t: OrgBillingPage["plan"];
  returnUrl: string;
  /** Runs before leaving for Stripe — the caller's chance to persist state it
   * will not get back once the redirect happens. */
  beforeCheckout?: () => Promise<void>;
}) {
  const [pendingPlan, setPendingPlan] = useState<StripePlanKey | null>(null);
  const posthog = usePostHog();

  const startCheckout = async (plan: StripePlanKey) => {
    setPendingPlan(plan);
    // Reported here rather than from a mutation, because upgrades go straight
    // to Stripe through better-auth and never touch tRPC.
    posthog.capture("checkout_started", { kind: "plan", plan, orgId });
    try {
      await beforeCheckout?.();
      await authClient.subscription.upgrade({
        plan,
        referenceId: orgId,
        customerType: "organization",
        successUrl: `${returnUrl}?${PLAN_CHECKOUT_QUERY_PARAM}=${plan}`,
        cancelUrl: returnUrl,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.checkoutFailed);
    } finally {
      setPendingPlan(null);
    }
  };

  return (
    // Top padding is the room the popular card lifts into, so it never pokes
    // out of whatever contains the grid.
    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3 md:pt-4">
      {SELLABLE_PLANS.map(({ plan, key }) => {
        const limits = PLAN_CATALOGUE[plan];
        return (
          <PlanCard
            key={key}
            planKey={key}
            copy={resolvePlanCopy(t.plans[key], limits, lang)}
            highlighted={key === "business"}
            badge={key === "business" ? t.mostPopularBadge : undefined}
            pending={pendingPlan === key}
            disabled={pendingPlan !== null}
            vatNote={t.vatNote}
            byoaiLabel={t.byoaiLabel}
            byoaiIncluded={limits.byoai}
            onSubscribe={() => void startCheckout(key)}
          />
        );
      })}
    </div>
  );
}
