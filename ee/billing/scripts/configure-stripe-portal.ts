/**
 * Configures the Stripe Customer Portal behind the "Manage billing" button.
 * Re-run whenever prices change: `npx tsx scripts/configure-stripe-portal.ts` (from ee/billing).
 *
 * Stripe has no way to unset an account's default portal configuration, so the app pins this
 * script's configuration via `STRIPE_PORTAL_CONFIGURATION_ID` (see stripe-plugin.ts); idempotency
 * is keyed off `metadata.managedBy` instead, since this script doesn't load apps/app/.env. First
 * run prints the id to copy into apps/app/.env (and the deploy env); later runs update it in place.
 *
 * Not automated: enabling Stripe Tax and setting the tax origin address (Dashboard -> Settings ->
 * Tax) must be done by hand, once.
 */
import { loadPackageEnv } from "@scibly/lib/internal";
import Stripe from "stripe";

import "dotenv/config";

import { priceIdByPlanKey, SELLABLE_PLANS } from "../src/plan-catalogue";
import { portalConfigurationFeatures } from "../src/stripe-portal";

const env = loadPackageEnv("@scibly/db", {
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PRICE_STARTER: process.env.STRIPE_PRICE_STARTER,
  STRIPE_PRICE_BUSINESS: process.env.STRIPE_PRICE_BUSINESS,
  STRIPE_PRICE_PRO: process.env.STRIPE_PRICE_PRO,
});

const priceIds = priceIdByPlanKey(env);

const MANAGED_BY_TAG = "configure-stripe-portal-script";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-02-25.clover",
});

async function main() {
  const prices = await Promise.all(
    SELLABLE_PLANS.map(({ key }) => stripe.prices.retrieve(priceIds[key])),
  );
  const products = prices.map((price) => ({
    product:
      typeof price.product === "string" ? price.product : price.product.id,
    prices: [price.id],
  }));

  const params: Stripe.BillingPortal.ConfigurationCreateParams = {
    business_profile: {
      headline: "Manage your Scibly subscription",
    },
    metadata: { managedBy: MANAGED_BY_TAG },
    features: portalConfigurationFeatures(products),
  };

  const configurations = await stripe.billingPortal.configurations.list({
    limit: 100,
  });
  const existing = configurations.data.find(
    (configuration) => configuration.metadata?.managedBy === MANAGED_BY_TAG,
  );

  if (existing) {
    const configuration = await stripe.billingPortal.configurations.update(
      existing.id,
      params,
    );
    console.log(`Updated billing portal configuration: ${configuration.id}`);
    return;
  }

  const configuration =
    await stripe.billingPortal.configurations.create(params);
  console.log(`Created billing portal configuration: ${configuration.id}`);
  console.log(
    `Set STRIPE_PORTAL_CONFIGURATION_ID=${configuration.id} in apps/app/.env so the app pins to it on every portal session.`,
  );
}

main();
