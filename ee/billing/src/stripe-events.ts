import type Stripe from "stripe";

import { db } from "@scibly/db";

import "server-only";

import { syncSubscription } from "./sync-subscription";
import { grantTopupOnStripeEvent } from "./topup";

// The one funnel every Stripe webhook passes through: the top-up grant, then the projection of a subscription into the domain tables.
export async function onStripeEvent(event: Stripe.Event): Promise<void> {
  await grantTopupOnStripeEvent(event);

  const stripeSubscriptionId = readSubscriptionId(event);
  if (!stripeSubscriptionId) return;

  const subscription = await db.subscription.findUnique({
    where: { stripeSubscriptionId },
  });

  if (!subscription) return;

  await syncSubscription(db, subscription);
}

// The subscription a webhook concerns, or null — a top-up checkout shares its event type with a subscription checkout but carries no subscription.
function readSubscriptionId(event: Stripe.Event): string | null {
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      return event.data.object.id;
    case "checkout.session.completed": {
      const { subscription } = event.data.object;
      return typeof subscription === "string"
        ? subscription
        : (subscription?.id ?? null);
    }
    default:
      return null;
  }
}
