import type Stripe from "stripe";

import {
  type SubscriptionPlan,
  type SubscriptionStatus,
} from "@scibly/db/enums";

import { SELLABLE_PLANS } from "./plan-catalogue";

// The plugin lower-cases `StripePlan.name`, so every plan name this module sees is a plugin key from the catalogue.
const PLUGIN_PLAN_TO_SUBSCRIPTION_PLAN: Record<string, SubscriptionPlan> =
  Object.fromEntries(SELLABLE_PLANS.map(({ key, plan }) => [key, plan]));

// Fails loudly on an unmapped plan rather than silently skipping — Stripe retries the webhook instead of us losing the event.
export function mapPluginPlanToSubscriptionPlan(
  pluginPlanName: string,
): SubscriptionPlan {
  const plan = PLUGIN_PLAN_TO_SUBSCRIPTION_PLAN[pluginPlanName.toLowerCase()];
  if (!plan) {
    throw new Error(
      `Stripe sync: unmapped plan "${pluginPlanName}". Failing closed.`,
    );
  }
  return plan;
}

// Keyed by raw string, because the stored row's column is untyped; exhaustive over
// Stripe's statuses, so a new one is a compile error rather than a silent refusal.
const STRIPE_STATUS_TO_SUBSCRIPTION_STATUS = new Map<
  string,
  SubscriptionStatus
>(
  Object.entries({
    active: "ACTIVE",
    trialing: "ACTIVE",
    past_due: "PAST_DUE",
    unpaid: "PAST_DUE",

    incomplete: "PAST_DUE",

    paused: "PAST_DUE",
    canceled: "CANCELED",
    incomplete_expired: "CANCELED",
  } satisfies Record<Stripe.Subscription.Status, SubscriptionStatus>),
);

// Fails loudly on an unmapped status so Stripe retries the webhook instead of us losing the event.
export function mapStripeStatusToSubscriptionStatus(
  status: string,
): SubscriptionStatus {
  const mapped = STRIPE_STATUS_TO_SUBSCRIPTION_STATUS.get(status);
  if (!mapped) {
    throw new Error(
      `Stripe sync: unmapped subscription status "${status}". Failing closed.`,
    );
  }
  return mapped;
}
