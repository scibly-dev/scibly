import { assertAllowed, decideAnonymousSession } from "@scibly/api/entitlement";
import { withRateLimit } from "@scibly/api/rate-limit";
import { db, type Prisma } from "@scibly/db";
import { type AnonymousSessionSource } from "@scibly/db/enums";

import "server-only";
import { notifyAfterResponding } from "@/features/organizations/server";
import { lockAnonymousAttempt } from "@/lib/db/transaction-locks";

import {
  computeScorePct,
  evaluatePassState,
  getActiveAttempt,
  transitionAttempt,
} from "../../progression/progression-rules";
import { computeCourseMaxSp } from "../../progression/server/grading";
import {
  getLatestCourseVersion,
  requireAnonymousCourse,
} from "./public-course";
import { notifySessionCeilingApproached } from "./session-ceiling-notice";

const ANONYMOUS_RATE_LIMIT_PER_HOUR = 120;

// Only starting a session spends the period ceiling, so starts get a tighter limit than other actions.
const ANONYMOUS_SESSION_START_RATE_LIMIT_PER_HOUR = 25;

export const ANONYMOUS_GRADING_RATE_LIMIT_PER_IP_PER_HOUR = 2_000;

export const ANONYMOUS_GRADING_RATE_LIMIT_PER_LEARNER_PER_HOUR = 200;

function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}

export function withAnonymousLearningRateLimit<T>(
  headers: Headers,
  endpoint: string,
  operation: () => Promise<T>,
  maxPerWindow: number = ANONYMOUS_RATE_LIMIT_PER_HOUR,
) {
  return withRateLimit(
    {
      db,
      identifier: getClientIp(headers),
      endpoint,
      maxPerWindow,
      tooManyRequestsMessage: "Too many requests. Please try again later.",
    },
    operation,
  );
}

// The anonymous id is client-supplied and rotatable, so the per-IP limit stays as a backstop against id rotation.
export function withAnonymousGradingRateLimit<T>(
  headers: Headers,
  anonymousId: string,
  endpoint: string,
  operation: () => Promise<T>,
) {
  return withAnonymousLearningRateLimit(
    headers,
    endpoint,
    () =>
      withRateLimit(
        {
          db,
          identifier: `anon:${anonymousId}`,
          endpoint,
          maxPerWindow: ANONYMOUS_GRADING_RATE_LIMIT_PER_LEARNER_PER_HOUR,
          tooManyRequestsMessage: "Too many requests. Please try again later.",
        },
        operation,
      ),
    ANONYMOUS_GRADING_RATE_LIMIT_PER_IP_PER_HOUR,
  );
}

type AnonymousSessionInput = {
  courseId: string;
  anonymousId: string;
  reset?: boolean;
  source?: AnonymousSessionSource;
  embedOrigin?: string | null;
};

const MAX_EMBED_ORIGIN_LENGTH = 255;

// Only the origin is kept, never the path — the path would record a customer's own visitors' URLs.
export function normalizeEmbedOrigin(
  candidate: string | null | undefined,
): string | null {
  if (!candidate) return null;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  const origin = url.origin.toLowerCase();
  if (origin === "null" || origin.length > MAX_EMBED_ORIGIN_LENGTH) return null;
  return origin;
}

function sourceFieldsForCreate(input: AnonymousSessionInput) {
  if (!input.source) return {};
  return {
    sessionSource: input.source,
    embedOrigin: normalizeEmbedOrigin(input.embedOrigin),
  };
}

async function startAnonymousSessionTransaction(
  tx: Prisma.TransactionClient,
  input: AnonymousSessionInput,
  policy: {
    organizationId: string;
    courseVersionId: string;
    maxTries: number | null;
    passingScorePct: number | null;
  },
) {
  await lockAnonymousAttempt(tx, input.anonymousId, policy.courseVersionId);
  const key = {
    anonymousId: input.anonymousId,
    courseVersionId: policy.courseVersionId,
  };
  const existing = await tx.anonymousCourseSession.findUnique({
    where: { anonymousId_courseVersionId: key },
  });
  if (!existing) {
    const decision = await decideAnonymousSession(tx, policy.organizationId);
    assertAllowed(decision);
    const created = await tx.anonymousCourseSession.upsert({
      where: { anonymousId_courseVersionId: key },
      update: {},
      create: {
        ...key,
        courseId: input.courseId,
        status: "IN_PROGRESS",
        ...sourceFieldsForCreate(input),
      },
    });
    return {
      sessionId: created.id,
      courseVersionId: policy.courseVersionId,
      ceiling: decision.ceiling,
    };
  }
  if (existing.status !== "COMPLETED") {
    const active = await tx.anonymousCourseSession.update({
      where: { id: existing.id },
      data: { status: "IN_PROGRESS" },
    });
    return {
      sessionId: active.id,
      courseVersionId: policy.courseVersionId,
      ceiling: null,
    };
  }
  if (input.reset !== true) {
    return {
      sessionId: existing.id,
      courseVersionId: policy.courseVersionId,
      ceiling: null,
    };
  }
  const transition = transitionAttempt(
    {
      status: "finished",
      completedSceneIds: new Set(),
      passed: evaluatePassState({
        status: existing.status,
        scorePct: existing.scorePct,
        passingScorePct: policy.passingScorePct,
      }),
      triesUsed: existing.triesUsed,
      maxTries: policy.maxTries,
    },
    { type: "reopen-failed-attempt" },
  );
  if (transition.kind !== "accepted") {
    return {
      sessionId: existing.id,
      courseVersionId: policy.courseVersionId,
      ceiling: null,
    };
  }
  const restarted = await tx.anonymousCourseSession.update({
    where: { id: existing.id },
    data: {
      status: "IN_PROGRESS",
      completedAt: null,
      scorePct: null,
      totalSpEarned: 0,
    },
  });
  return {
    sessionId: restarted.id,
    courseVersionId: policy.courseVersionId,
    ceiling: null,
  };
}

async function startAnonymousSession(input: AnonymousSessionInput) {
  const [course, latestVersion] = await Promise.all([
    requireAnonymousCourse(input.courseId),
    getLatestCourseVersion(input.courseId),
  ]);
  const { ceiling, ...session } = await db.$transaction((tx) =>
    startAnonymousSessionTransaction(tx, input, {
      organizationId: course.organizationId,
      courseVersionId: latestVersion.id,
      maxTries: course.maxTries,
      passingScorePct: course.passingScorePct,
    }),
  );

  if (ceiling) {
    notifyAfterResponding(() =>
      notifySessionCeilingApproached(course.organizationId, ceiling),
    );
  }
  return session;
}

export function startAnonymousLearningSession(
  headers: Headers,
  input: AnonymousSessionInput,
) {
  return withAnonymousLearningRateLimit(
    headers,
    "anon.startSession",
    () => startAnonymousSession(input),
    ANONYMOUS_SESSION_START_RATE_LIMIT_PER_HOUR,
  );
}

type AnonymousCompletionInput = {
  courseId: string;
  anonymousId: string;
};

async function completeAnonymousSessionTransaction(
  tx: Prisma.TransactionClient,
  input: AnonymousCompletionInput,
  courseVersionId: string,
  passingScorePct: number | null,
) {
  await lockAnonymousAttempt(tx, input.anonymousId, courseVersionId);
  const key = { anonymousId: input.anonymousId, courseVersionId };
  const existing = await tx.anonymousCourseSession.findUnique({
    where: { anonymousId_courseVersionId: key },
  });
  if (existing?.status === "COMPLETED") {
    return {
      success: true,
      scorePct: existing.scorePct ?? 0,
      passed: evaluatePassState({
        status: existing.status,
        scorePct: existing.scorePct,
        passingScorePct,
      }),
    };
  }
  const attempt = existing ? getActiveAttempt(existing) : 1;
  const [analytics, possibleSp] = await Promise.all([
    existing
      ? tx.sceneAnalytics.findMany({
          where: { anonymousSessionId: existing.id, attempt },
          select: { spEarned: true },
        })
      : [],
    computeCourseMaxSp(tx, courseVersionId),
  ]);
  const totalSpEarned = analytics.reduce(
    (total, row) => total + row.spEarned,
    0,
  );
  const scorePct = computeScorePct(totalSpEarned, possibleSp);
  const passed = evaluatePassState({
    status: "COMPLETED",
    scorePct,
    passingScorePct,
  });
  await tx.anonymousCourseSession.upsert({
    where: { anonymousId_courseVersionId: key },
    update: {
      status: "COMPLETED",
      completedAt: new Date(),
      totalSpEarned,
      scorePct,
      triesUsed: { increment: 1 },
    },
    create: {
      ...key,
      courseId: input.courseId,
      status: "COMPLETED",
      completedAt: new Date(),
      totalSpEarned,
      scorePct,
      triesUsed: 1,
    },
  });
  return { success: true, scorePct, passed };
}

async function completeAnonymousSession(input: AnonymousCompletionInput) {
  const [course, latestVersion] = await Promise.all([
    requireAnonymousCourse(input.courseId),
    getLatestCourseVersion(input.courseId),
  ]);
  return db.$transaction((tx) =>
    completeAnonymousSessionTransaction(
      tx,
      input,
      latestVersion.id,
      course.passingScorePct,
    ),
  );
}

export function completeAnonymousLearningSession(
  headers: Headers,
  input: AnonymousCompletionInput,
) {
  return withAnonymousLearningRateLimit(headers, "anon.completeSession", () =>
    completeAnonymousSession(input),
  );
}
