import { type Prisma } from "@scibly/db/client";

import { PUBLIC_SESSIONS_EXHAUSTED } from "../codes";
import { type Decision } from "../decision";
import { resolveSubscribedPlan } from "../policy";

const PUBLIC_SESSION_WARNING_RATIO = 0.8;

// Counted through Course.organizationId rather than a dedicated column — cheap enough at session-creation volume.
const countAnonymousSessionsThisPeriod = (
  db: Prisma.TransactionClient,
  organizationId: string,
  periodStart: Date,
): Promise<number> =>
  db.anonymousCourseSession.count({
    where: { course: { organizationId }, startedAt: { gte: periodStart } },
  });

// Ceiling after a permitted session, handed to the warning so it isn't recounted; null when refused.
type SessionCeiling = {
  ceiling: {
    used: number;
    limit: number;
    warnAt: number;
    periodStart: Date;
  } | null;
};

// No `details`: the reader is a stranger who shouldn't see the organization's numbers on the wire.
const sessionsExhausted: Decision<SessionCeiling> = {
  ceiling: null,
  refusal: {
    applicationCode: PUBLIC_SESSIONS_EXHAUSTED,
    code: "SERVICE_UNAVAILABLE",
    message: "This course is not available right now.",
  },
};

export const decideAnonymousSession = async (
  db: Prisma.TransactionClient,
  organizationId: string,
): Promise<Decision<SessionCeiling>> => {
  const { plan, subscription, lapsed } = await resolveSubscribedPlan(
    db,
    organizationId,
  );
  if (lapsed) return sessionsExhausted;

  const used = await countAnonymousSessionsThisPeriod(
    db,
    organizationId,
    subscription.currentPeriodStart,
  );
  const limit = plan.anonymousSessionsPerPeriod;
  const remaining = Math.max(0, limit - used);
  if (remaining < 1) return sessionsExhausted;

  return {
    refusal: null,

    ceiling: {
      used: used + 1,
      limit,
      warnAt: Math.ceil(limit * PUBLIC_SESSION_WARNING_RATIO),
      periodStart: subscription.currentPeriodStart,
    },
  };
};
