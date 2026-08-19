import { type Prisma } from "@scibly/db/client";

import {
  decidePlanFeature,
  type PlanFeature,
  toGateDecision,
} from "./plan-feature";

const COURSE_PUBLISHING: PlanFeature = {
  includedIn: (limits) => limits.publishAndEnroll,
  applicationCode: "entitlement.publish_requires_plan",
  whenLapsed:
    "This organization's subscription has lapsed, so its courses can no longer be published. Reactivate the subscription to publish and enroll again.",
  whenNotInPlan: (requiredPlan) =>
    `Publishing a course requires a subscription. Everything this organization builds stays open to write and to preview — subscribe to the ${requiredPlan} plan or above to publish it and enroll learners.`,
};

export const decideCoursePublishing = (
  db: Prisma.TransactionClient,
  organizationId: string,
) => decidePlanFeature(db, organizationId, COURSE_PUBLISHING);

export const describeCoursePublishingAccess = async (
  db: Prisma.TransactionClient,
  organizationId: string,
) => toGateDecision(await decideCoursePublishing(db, organizationId));
