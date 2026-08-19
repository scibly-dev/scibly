import type Stripe from "stripe";

export type PortalProduct = { product: string; prices: string[] };

// When each side of a plan change takes effect, stated to Stripe rather than enforced after the fact — this is the configuration behind PC1 and PC5 (asserted in apps/app/src/features/organizations/server/billing-portal-configuration.test.ts). Applied by scripts/configure-stripe-portal.ts, which has to be re-run for a change here to reach the account.
export const portalConfigurationFeatures = (
  products: PortalProduct[],
): Stripe.BillingPortal.ConfigurationCreateParams.Features => ({
  invoice_history: { enabled: true },
  payment_method_update: { enabled: true },
  subscription_cancel: { enabled: true, mode: "at_period_end" },
  subscription_update: {
    enabled: true,
    default_allowed_updates: ["price"],
    products,

    proration_behavior: "always_invoice",

    schedule_at_period_end: {
      conditions: [{ type: "decreasing_item_amount" }],
    },
  },
});
