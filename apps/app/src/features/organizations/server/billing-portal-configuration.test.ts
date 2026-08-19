import { portalConfigurationFeatures } from "@scibly/ee-billing/stripe-portal";
import { describe, expect, it } from "vitest";

// The parameters scripts/configure-stripe-portal.ts sends to Stripe. The run stays manual, so this only proves the policy we ship, not what the account currently holds.
const features = portalConfigurationFeatures([
  { product: "prod_starter", prices: ["price_starter"] },
]);

describe("PC1/PC5 — the portal states when each side of a plan change takes effect", () => {
  it("PC1: an upgrade is invoiced on the spot rather than parked on the next invoice", () => {
    expect(features.subscription_update?.proration_behavior).toBe(
      "always_invoice",
    );
  });

  it("PC5: a decrease is scheduled for the end of the period instead of applied", () => {
    expect(features.subscription_update?.schedule_at_period_end).toEqual({
      conditions: [{ type: "decreasing_item_amount" }],
    });
  });

  it("PC5: a cancellation waits for the period out too", () => {
    expect(features.subscription_cancel).toMatchObject({
      enabled: true,
      mode: "at_period_end",
    });
  });
});
