import { withRateLimit } from "@scibly/api/rate-limit";
import { db } from "@scibly/db";
import {
  type SubscriptionPlan,
  type SubscriptionStatus,
} from "@scibly/db/enums";

import {
  requireOrganizationBySlug,
  requireOrgMember,
} from "@/features/organizations/server/policy";

type SubscriptionStanding = {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  pastDueSince: Date | null;
};

export type MaybeBillableSubscription = SubscriptionStanding & {
  stripeCustomerId: string | null;
};
export type MaybeSeatAdjustableSubscription = SubscriptionStanding & {
  stripeSubscriptionId: string | null;
};

export type BillableSubscription = MaybeBillableSubscription & {
  stripeCustomerId: string;
};

export type SeatAdjustableSubscription = MaybeSeatAdjustableSubscription & {
  stripeSubscriptionId: string;
};

export async function requireBillingOwner(
  orgSlug: string,
  userId: string,
): Promise<string> {
  const { id: organizationId } = await requireOrganizationBySlug(orgSlug);
  await requireOrgMember(organizationId, userId, "owner");
  return organizationId;
}

export const BILLING_PURCHASES_PER_HOUR = 10;

export const BILLING_CLAIMS_PER_HOUR = 30;

export function withBillingRateLimit<T>(
  organizationId: string,
  endpoint: string,
  maxPerWindow: number,
  purchase: () => Promise<T>,
): Promise<T> {
  return withRateLimit(
    {
      db,
      identifier: organizationId,
      endpoint,
      maxPerWindow,
      tooManyRequestsMessage:
        "Too many billing requests. Please try again in a few minutes.",
    },
    purchase,
  );
}
