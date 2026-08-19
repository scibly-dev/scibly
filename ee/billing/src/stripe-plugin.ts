import type Stripe from "stripe";

import { stripe } from "@better-auth/stripe";
import { db } from "@scibly/db";

import "server-only";

import { authorizeStripeReference } from "./authorize-reference";
import { priceIdByPlanKey, SELLABLE_PLANS } from "./plan-catalogue";
import { stripeClient, stripeEnv as env } from "./stripe-client";
import { onStripeEvent } from "./stripe-events";

// The plugin falls back to Stripe's account-default portal configuration; pin ours explicitly instead (see ee/billing/scripts/configure-stripe-portal.ts).
const createPortalSession = stripeClient.billingPortal.sessions.create.bind(
  stripeClient.billingPortal.sessions,
);
// Only the (params, options) overload is implemented — the plugin never calls the options-only one — hence the cast to assign over the overloaded method.
const pinnedPortalSessionCreate = (
  params?: Stripe.BillingPortal.SessionCreateParams,
  options?: Stripe.RequestOptions,
) =>
  createPortalSession(
    { configuration: env.STRIPE_PORTAL_CONFIGURATION_ID, ...params },
    options,
  );
// SAFETY: only the (params, options) overload is implemented, which is the one the plugin calls.
stripeClient.billingPortal.sessions.create =
  pinnedPortalSessionCreate as typeof stripeClient.billingPortal.sessions.create;

const priceIds = priceIdByPlanKey(env);

export const stripePlugin = stripe({
  stripeClient,
  stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,

  onEvent: onStripeEvent,

  createCustomerOnSignUp: false,
  organization: { enabled: true },
  subscription: {
    enabled: true,
    plans: SELLABLE_PLANS.map(({ key }) => ({
      name: key,
      priceId: priceIds[key],

      prorationBehavior: "always_invoice" as const,
    })),
    authorizeReference: async ({ user, referenceId, action }) =>
      authorizeStripeReference(db, { user, referenceId, action }),

    getCheckoutSessionParams: async () => ({
      params: {
        automatic_tax: { enabled: true },
        tax_id_collection: { enabled: true },
        billing_address_collection: "required",
        customer_update: { address: "auto", name: "auto" },
      },
    }),
  },
});
