import type Stripe from "stripe";

import { db, Prisma } from "@scibly/db";
import { CreditAction, CreditBucket } from "@scibly/db/enums";
import { TOPUP_SESSION_QUERY_PARAM } from "@scibly/routes";

import "server-only";

import { stripeClient, stripeEnv } from "./stripe-client";
import {
  isTopupPackKey,
  TOPUP_PACKS,
  type TopupPackKey,
} from "./topup-catalogue";

const PACK_PRICE_IDS = {
  small: stripeEnv.STRIPE_PRICE_TOPUP_SMALL,
  large: stripeEnv.STRIPE_PRICE_TOPUP_LARGE,
} satisfies Record<TopupPackKey, string>;

const ORGANIZATION_KEY = "scibly_organization_id";
const PACK_KEY = "scibly_topup_pack";
const BUYER_KEY = "scibly_topup_buyer_id";

type TopupGrantOutcome =
  | { status: "granted"; credits: number }
  | { status: "already-granted" }
  | { status: "ignored"; reason: string };

export async function createTopupCheckoutSession(params: {
  organizationId: string;
  buyerId: string;
  pack: TopupPackKey;
  stripeCustomerId: string;

  returnUrl: string;
}): Promise<string> {
  const metadata = {
    [ORGANIZATION_KEY]: params.organizationId,
    [PACK_KEY]: params.pack,
    [BUYER_KEY]: params.buyerId,
  };

  const session = await stripeClient.checkout.sessions.create({
    mode: "payment",
    customer: params.stripeCustomerId,
    line_items: [{ price: PACK_PRICE_IDS[params.pack], quantity: 1 }],
    metadata,

    payment_intent_data: { metadata },
    success_url: `${params.returnUrl}?${TOPUP_SESSION_QUERY_PARAM}={CHECKOUT_SESSION_ID}`,
    cancel_url: params.returnUrl,

    automatic_tax: { enabled: true },
    tax_id_collection: { enabled: true },
    billing_address_collection: "required",
    customer_update: { address: "auto", name: "auto" },
  });

  if (!session.url) {
    throw new Error(
      `Stripe returned a top-up session with no URL (${session.id}).`,
    );
  }
  return session.url;
}

export async function grantTopupOnStripeEvent(
  event: Stripe.Event,
): Promise<void> {
  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded"
  ) {
    return;
  }
  await grantTopupForSession(event.data.object);
}

export async function claimTopupCheckout(params: {
  sessionId: string;
  organizationId: string;
}): Promise<TopupGrantOutcome> {
  const session = await stripeClient.checkout.sessions.retrieve(
    params.sessionId,
  );
  return grantTopupForSession(session, params.organizationId);
}

async function grantTopupForSession(
  session: Stripe.Checkout.Session,
  expectedOrganizationId?: string,
): Promise<TopupGrantOutcome> {
  const ignored = (reason: string): TopupGrantOutcome => ({
    status: "ignored",
    reason,
  });

  if (session.mode !== "payment") return ignored("not a one-off payment");

  if (session.payment_status !== "paid") return ignored("not paid");

  const organizationId = session.metadata?.[ORGANIZATION_KEY];
  const pack = session.metadata?.[PACK_KEY];
  if (!organizationId || !pack || !isTopupPackKey(pack)) {
    return ignored("no top-up metadata");
  }
  if (expectedOrganizationId && expectedOrganizationId !== organizationId) {
    return ignored("belongs to another organization");
  }

  const credits = await creditsPaidFor(session.id);
  if (credits === 0) {
    console.error(
      `Top-up session ${session.id} paid for no known pack; nothing credited.`,
    );
    return ignored("no known pack in the paid line items");
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.creditLedgerEntry.create({
        data: {
          id: `topup_${session.id}`,
          organizationId,
          actorId: session.metadata?.[BUYER_KEY] ?? null,
          action: CreditAction.TOPUP_PURCHASE,
          creditsCharged: credits,
          bucket: CreditBucket.TOPUP,
        },
      });

      const { count } = await tx.organizationCredit.updateMany({
        where: { organizationId },
        data: {
          topupRemaining: { increment: credits },

          notifiedAllowanceThreshold: 0,
        },
      });

      if (count === 0) {
        throw new Error(
          `Top-up grant: organization ${organizationId} has no credit row. Failing closed.`,
        );
      }
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { status: "already-granted" };
    }
    throw error;
  }

  return { status: "granted", credits };
}

async function creditsPaidFor(sessionId: string): Promise<number> {
  const lineItems = await stripeClient.checkout.sessions.listLineItems(
    sessionId,
    { limit: 100 },
  );
  return lineItems.data.reduce((credits, item) => {
    const priceId = item.price?.id;
    const match = priceId
      ? Object.entries(PACK_PRICE_IDS).find(([, id]) => id === priceId)?.[0]
      : undefined;
    const pack = match && isTopupPackKey(match) ? match : null;
    if (!pack) return credits;
    return credits + TOPUP_PACKS[pack].credits * (item.quantity ?? 1);
  }, 0);
}
