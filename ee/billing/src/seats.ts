import type Stripe from "stripe";

import { db } from "@scibly/db";
import { SubscriptionPlan } from "@scibly/db/enums";

import "server-only";

import { stripeClient, stripeEnv } from "./stripe-client";

// Learner seats are a quantity on the plan's own Stripe subscription, so they renew with the plan instead of beside it.

const SEAT_PRICE_IDS = {
  [SubscriptionPlan.TRIAL]: undefined,
  [SubscriptionPlan.STARTER]: stripeEnv.STRIPE_PRICE_SEAT_STARTER,
  [SubscriptionPlan.BUSINESS]: stripeEnv.STRIPE_PRICE_SEAT_BUSINESS,
  [SubscriptionPlan.PRO]: stripeEnv.STRIPE_PRICE_SEAT_PRO,
  [SubscriptionPlan.INTERNAL]: undefined,
} satisfies Record<SubscriptionPlan, string | undefined>;

const isSeatPrice = (priceId: string | undefined): boolean =>
  priceId !== undefined && Object.values(SEAT_PRICE_IDS).includes(priceId);

function seatPriceOrThrow(plan: SubscriptionPlan): string {
  const priceId = SEAT_PRICE_IDS[plan];
  if (!priceId) throw new Error(`Plan ${plan} does not sell learner seats.`);
  return priceId;
}

// The seat line as it stands today and what it would become; `itemId` is undefined for an organization buying its first seats.
async function seatLineAfter(params: {
  plan: SubscriptionPlan;
  stripeSubscriptionId: string;
  quantity: number;
}) {
  const priceId = seatPriceOrThrow(params.plan);
  const subscription = await stripeClient.subscriptions.retrieve(
    params.stripeSubscriptionId,
  );
  const seatItem = subscription.items.data.find((item) =>
    isSeatPrice(item.price?.id),
  );
  return {
    priceId,
    itemId: seatItem?.id,

    quantity: (seatItem?.quantity ?? 0) + params.quantity,
  };
}

// What buying `quantity` seats would charge right now, without charging or changing anything.
export async function previewLearnerSeatPurchase(params: {
  plan: SubscriptionPlan;
  stripeSubscriptionId: string;
  quantity: number;
}): Promise<{
  amountDueCents: number;

  seatsAfter: number;

  periodEnd: Date | null;
}> {
  const line = await seatLineAfter(params);
  const invoice = await stripeClient.invoices.createPreview({
    subscription: params.stripeSubscriptionId,
    subscription_details: {
      items: [
        line.itemId
          ? { id: line.itemId, price: line.priceId, quantity: line.quantity }
          : { price: line.priceId, quantity: line.quantity },
      ],
      proration_behavior: "always_invoice",
    },
  });

  const prorations = invoice.lines.data.filter(
    (item) => item.parent?.subscription_item_details?.proration,
  );

  return {
    amountDueCents: prorations.reduce((total, item) => total + item.amount, 0),
    seatsAfter: line.quantity,

    periodEnd: prorationPeriodEnd(prorations),
  };
}

function prorationPeriodEnd(prorations: Stripe.InvoiceLineItem[]): Date | null {
  const end = Math.max(0, ...prorations.map((item) => item.period.end));
  return end > 0 ? new Date(end * 1000) : null;
}

// Raises the seat quantity by `quantity` and returns what Stripe now bills; the caller has already authorized this and shown the buyer the price.
export async function purchaseLearnerSeats(params: {
  organizationId: string;
  plan: SubscriptionPlan;
  stripeSubscriptionId: string;
  quantity: number;
}): Promise<{ purchasedSeats: number }> {
  const line = await seatLineAfter(params);

  const idempotencyKey = `seats_${params.organizationId}_${line.priceId}_${line.quantity}`;

  const item = line.itemId
    ? await stripeClient.subscriptionItems.update(
        line.itemId,
        {
          price: line.priceId,
          quantity: line.quantity,
          proration_behavior: "always_invoice",
        },
        { idempotencyKey },
      )
    : await stripeClient.subscriptionItems.create(
        {
          subscription: params.stripeSubscriptionId,
          price: line.priceId,
          quantity: line.quantity,
          proration_behavior: "always_invoice",
        },
        { idempotencyKey },
      );

  const purchasedSeats = item.quantity ?? 0;
  await db.organizationSubscription.update({
    where: { organizationId: params.organizationId },
    data: { purchasedLearnerSeats: purchasedSeats },
  });

  return { purchasedSeats };
}
