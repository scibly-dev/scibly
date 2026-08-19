import { type Prisma } from "@scibly/db/client";

import {
  decidePlanFeature,
  type PlanFeature,
  toGateDecision,
} from "./plan-feature";

const BYOAI_CONFIGURATION: PlanFeature = {
  includedIn: (limits) => limits.byoai,
  applicationCode: "entitlement.byoai_requires_upgrade",
  whenLapsed:
    "This organization's subscription has lapsed, so its own AI endpoints can no longer be configured. Reactivate the subscription to change them.",
  whenNotInPlan: (requiredPlan) =>
    `Connecting your own AI endpoint is included from the ${requiredPlan} plan upwards. Upgrade to ${requiredPlan} to point generations at your own key — until then they run on ours and are charged to the organization's balance.`,
};

export const decideByoaiConfiguration = (
  db: Prisma.TransactionClient,
  organizationId: string,
) => decidePlanFeature(db, organizationId, BYOAI_CONFIGURATION);

export const describeByoaiAccess = async (
  db: Prisma.TransactionClient,
  organizationId: string,
) => toGateDecision(await decideByoaiConfiguration(db, organizationId));
