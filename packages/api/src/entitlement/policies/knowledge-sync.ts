import { type Prisma } from "@scibly/db/client";

import {
  decidePlanFeature,
  type PlanFeature,
  toGateDecision,
} from "./plan-feature";

const KNOWLEDGE_SYNC: PlanFeature = {
  includedIn: (limits) => limits.knowledgeSync,
  applicationCode: "entitlement.knowledge_sync_requires_upgrade",
  whenLapsed:
    "This organization's subscription has lapsed, so its knowledge topics can no longer be changed. Reactivate the subscription to edit them.",
  whenNotInPlan: (requiredPlan) =>
    `Keeping documentation in sync with your repositories is included from the ${requiredPlan} plan upwards. Upgrade to ${requiredPlan} to create knowledge topics.`,
};

export const decideKnowledgeSync = (
  db: Prisma.TransactionClient,
  organizationId: string,
) => decidePlanFeature(db, organizationId, KNOWLEDGE_SYNC);

export const describeKnowledgeSyncAccess = async (
  db: Prisma.TransactionClient,
  organizationId: string,
) => toGateDecision(await decideKnowledgeSync(db, organizationId));
