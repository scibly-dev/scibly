import type { AuthorizeReferenceAction } from "@better-auth/stripe";

import { type PrismaClient } from "@scibly/db/client";

// Billing actions are owner-only; viewing the subscription (`list-subscription`) is the one action any member may take.
export async function authorizeStripeReference(
  db: PrismaClient,
  data: {
    user: { id: string };
    referenceId: string;
    action: AuthorizeReferenceAction;
  },
): Promise<boolean> {
  const { user, referenceId, action } = data;
  const member = await db.member.findFirst({
    where:
      action === "list-subscription"
        ? { organizationId: referenceId, userId: user.id }
        : { organizationId: referenceId, userId: user.id, role: "owner" },
    select: { id: true },
  });
  return Boolean(member);
}
