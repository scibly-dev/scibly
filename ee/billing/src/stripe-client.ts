import { loadPackageEnv } from "@scibly/lib/internal";
import Stripe from "stripe";

import "server-only";

// Every Stripe secret in one place, read once at boot, so a missing price id fails here rather than in front of someone who has just decided to pay us.
export const stripeEnv = loadPackageEnv("@scibly/auth", {
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  STRIPE_PRICE_STARTER: process.env.STRIPE_PRICE_STARTER,
  STRIPE_PRICE_BUSINESS: process.env.STRIPE_PRICE_BUSINESS,
  STRIPE_PRICE_PRO: process.env.STRIPE_PRICE_PRO,
  STRIPE_PRICE_TOPUP_SMALL: process.env.STRIPE_PRICE_TOPUP_SMALL,
  STRIPE_PRICE_TOPUP_LARGE: process.env.STRIPE_PRICE_TOPUP_LARGE,
  STRIPE_PRICE_SEAT_STARTER: process.env.STRIPE_PRICE_SEAT_STARTER,
  STRIPE_PRICE_SEAT_BUSINESS: process.env.STRIPE_PRICE_SEAT_BUSINESS,
  STRIPE_PRICE_SEAT_PRO: process.env.STRIPE_PRICE_SEAT_PRO,
  STRIPE_PORTAL_CONFIGURATION_ID: process.env.STRIPE_PORTAL_CONFIGURATION_ID,
});

export const stripeClient = new Stripe(stripeEnv.STRIPE_SECRET_KEY, {
  apiVersion: "2026-02-25.clover",
});
