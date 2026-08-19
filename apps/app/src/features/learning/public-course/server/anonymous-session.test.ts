import type * as RateLimitModule from "@scibly/api/rate-limit";
import type { Prisma } from "@scibly/db";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { transactionsRun } from "@/shared/testing/prisma-transaction";

// The progression-rules functions are kept real; everything else (db, locking, course lookups) is doubled.

const tx = {
  anonymousCourseSession: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),

    count: vi.fn(),
  },
  organizationSubscription: { findUnique: vi.fn() },
  sceneAnalytics: { findMany: vi.fn() },
};

const db = vi.hoisted(() => ({ $transaction: vi.fn() }));

vi.mock("@scibly/db", () => ({ db }));

const lockAnonymousAttempt = vi.hoisted(() => vi.fn());
vi.mock("@/lib/db/transaction-locks", () => ({ lockAnonymousAttempt }));

const requireAnonymousCourse = vi.hoisted(() => vi.fn());
const getLatestCourseVersion = vi.hoisted(() => vi.fn());
vi.mock("./public-course", () => ({
  requireAnonymousCourse,
  getLatestCourseVersion,
}));

const computeCourseMaxSp = vi.hoisted(() => vi.fn());
vi.mock("../../progression/server/grading", () => ({ computeCourseMaxSp }));

const withRateLimit = vi.hoisted(() =>
  vi.fn((_opts: unknown, operation: () => unknown) => operation()),
);
// Only the limiter is stubbed; TimeHelpers ships from here too and the entitlement policy reads it.
vi.mock("@scibly/api/rate-limit", async (importOriginal) => ({
  ...(await importOriginal<typeof RateLimitModule>()),
  withRateLimit,
}));

const notifySessionCeilingApproached = vi.hoisted(() => vi.fn());
vi.mock("./session-ceiling-notice", () => ({ notifySessionCeilingApproached }));

const {
  startAnonymousLearningSession,
  completeAnonymousLearningSession,
  withAnonymousGradingRateLimit,
  ANONYMOUS_GRADING_RATE_LIMIT_PER_IP_PER_HOUR,
  ANONYMOUS_GRADING_RATE_LIMIT_PER_LEARNER_PER_HOUR,
} = await import("./anonymous-session");

const headers = new Headers();
const COURSE = { organizationId: "org-1", maxTries: 3, passingScorePct: 70 };
const VERSION = { id: "v1", version: 1 };

beforeEach(() => {
  vi.clearAllMocks();
  transactionsRun(db, tx);
  requireAnonymousCourse.mockResolvedValue(COURSE);
  getLatestCourseVersion.mockResolvedValue(VERSION);
  computeCourseMaxSp.mockResolvedValue(100);
  tx.organizationSubscription.findUnique.mockResolvedValue({
    plan: "BUSINESS",
    status: "ACTIVE",
    purchasedLearnerSeats: 0,
    currentPeriodStart: new Date("2026-08-01T00:00:00Z"),
  });
  tx.anonymousCourseSession.count.mockResolvedValue(0);
});

describe("startAnonymousLearningSession", () => {
  it("AS1: creates a new IN_PROGRESS session when none exists", async () => {
    tx.anonymousCourseSession.findUnique.mockResolvedValue(null);
    tx.anonymousCourseSession.upsert.mockResolvedValue({ id: "s1" });

    const result = await startAnonymousLearningSession(headers, {
      courseId: "c1",
      anonymousId: "anon1",
    });

    expect(tx.anonymousCourseSession.upsert).toHaveBeenCalledWith({
      where: {
        anonymousId_courseVersionId: {
          anonymousId: "anon1",
          courseVersionId: "v1",
        },
      },
      update: {},
      create: {
        anonymousId: "anon1",
        courseVersionId: "v1",
        courseId: "c1",
        status: "IN_PROGRESS",
      },
    });
    expect(result).toEqual({ sessionId: "s1", courseVersionId: "v1" });
  });

  it("AS2: resumes a non-COMPLETED session by re-setting it to IN_PROGRESS", async () => {
    tx.anonymousCourseSession.findUnique.mockResolvedValue({
      id: "s1",
      status: "IN_PROGRESS",
      triesUsed: 0,
      scorePct: null,
    });
    tx.anonymousCourseSession.update.mockResolvedValue({ id: "s1" });

    await startAnonymousLearningSession(headers, {
      courseId: "c1",
      anonymousId: "anon1",
    });

    expect(tx.anonymousCourseSession.update).toHaveBeenCalledWith({
      where: { id: "s1" },
      data: { status: "IN_PROGRESS" },
    });
    expect(tx.anonymousCourseSession.upsert).not.toHaveBeenCalled();
  });

  it("AS3: returns a COMPLETED session unchanged when reset is not requested", async () => {
    const existing = {
      id: "s1",
      status: "COMPLETED",
      triesUsed: 1,
      scorePct: 40,
    };
    tx.anonymousCourseSession.findUnique.mockResolvedValue(existing);

    const result = await startAnonymousLearningSession(headers, {
      courseId: "c1",
      anonymousId: "anon1",
    });

    expect(tx.anonymousCourseSession.update).not.toHaveBeenCalled();
    expect(tx.anonymousCourseSession.upsert).not.toHaveBeenCalled();
    expect(result).toEqual({ sessionId: "s1", courseVersionId: "v1" });
  });

  it("AS4: leaves an ineligible COMPLETED session untouched on reset (already passed)", async () => {
    tx.anonymousCourseSession.findUnique.mockResolvedValue({
      id: "s1",
      status: "COMPLETED",
      triesUsed: 1,
      scorePct: 80,
    });

    const result = await startAnonymousLearningSession(headers, {
      courseId: "c1",
      anonymousId: "anon1",
      reset: true,
    });

    expect(tx.anonymousCourseSession.update).not.toHaveBeenCalled();
    expect(result).toEqual({ sessionId: "s1", courseVersionId: "v1" });
  });

  it("AS4: leaves an ineligible COMPLETED session untouched on reset (no tries remaining)", async () => {
    tx.anonymousCourseSession.findUnique.mockResolvedValue({
      id: "s1",
      status: "COMPLETED",
      triesUsed: 3,
      scorePct: 40,
    });

    await startAnonymousLearningSession(headers, {
      courseId: "c1",
      anonymousId: "anon1",
      reset: true,
    });

    expect(tx.anonymousCourseSession.update).not.toHaveBeenCalled();
  });

  it("AS5: reopens an eligible COMPLETED session, clearing its score and progress", async () => {
    tx.anonymousCourseSession.findUnique.mockResolvedValue({
      id: "s1",
      status: "COMPLETED",
      triesUsed: 1,
      scorePct: 40,
    });
    tx.anonymousCourseSession.update.mockResolvedValue({ id: "s1" });

    await startAnonymousLearningSession(headers, {
      courseId: "c1",
      anonymousId: "anon1",
      reset: true,
    });

    expect(tx.anonymousCourseSession.update).toHaveBeenCalledWith({
      where: { id: "s1" },
      data: {
        status: "IN_PROGRESS",
        completedAt: null,
        scorePct: null,
        totalSpEarned: 0,
      },
    });
  });

  it("AS7: acquires the anonymous-attempt lock before reading the session", async () => {
    tx.anonymousCourseSession.findUnique.mockResolvedValue(null);
    tx.anonymousCourseSession.upsert.mockResolvedValue({ id: "s1" });

    await startAnonymousLearningSession(headers, {
      courseId: "c1",
      anonymousId: "anon1",
    });

    expect(lockAnonymousAttempt).toHaveBeenCalledWith(tx, "anon1", "v1");
    const lockOrder = lockAnonymousAttempt.mock.invocationCallOrder[0]!;
    const findOrder =
      tx.anonymousCourseSession.findUnique.mock.invocationCallOrder[0]!;
    expect(lockOrder).toBeLessThan(findOrder);
  });
});

describe("recording where a session started", () => {
  async function createdSession(
    input: { source?: "DIRECT" | "EMBED"; embedOrigin?: string | null } = {},
  ) {
    tx.anonymousCourseSession.findUnique.mockResolvedValue(null);
    tx.anonymousCourseSession.upsert.mockResolvedValue({ id: "s1" });

    await startAnonymousLearningSession(headers, {
      courseId: "c1",
      anonymousId: "anon1",
      ...input,
    });

    return tx.anonymousCourseSession.upsert.mock.calls[0]![0].create as {
      sessionSource?: string;
      embedOrigin?: string | null;
    };
  }

  it("records the stated source and normalized origin on creation", async () => {
    const created = await createdSession({
      source: "EMBED",
      embedOrigin: "https://Acme.Example",
    });

    expect(created).toMatchObject({
      sessionSource: "EMBED",
      embedOrigin: "https://acme.example",
    });
  });

  it("leaves an existing session's attribution alone when it is resumed", async () => {
    tx.anonymousCourseSession.findUnique.mockResolvedValue({
      id: "s1",
      status: "IN_PROGRESS",
      triesUsed: 0,
      scorePct: null,
    });
    tx.anonymousCourseSession.update.mockResolvedValue({ id: "s1" });

    await startAnonymousLearningSession(headers, {
      courseId: "c1",
      anonymousId: "anon1",
      source: "DIRECT",
    });

    expect(tx.anonymousCourseSession.update).toHaveBeenCalledWith({
      where: { id: "s1" },
      data: { status: "IN_PROGRESS" },
    });
  });

  it("leaves an existing session's attribution alone when it is reopened", async () => {
    tx.anonymousCourseSession.findUnique.mockResolvedValue({
      id: "s1",
      status: "COMPLETED",
      triesUsed: 1,
      scorePct: 40,
    });
    tx.anonymousCourseSession.update.mockResolvedValue({ id: "s1" });

    await startAnonymousLearningSession(headers, {
      courseId: "c1",
      anonymousId: "anon1",
      reset: true,
      source: "EMBED",
      embedOrigin: "https://acme.example",
    });

    const data = tx.anonymousCourseSession.update.mock.calls[0]![0]
      .data as Prisma.AnonymousCourseSessionUpdateInput;
    expect(data).not.toHaveProperty("sessionSource");
    expect(data).not.toHaveProperty("embedOrigin");
  });

  it("discards the path of the embedding page", async () => {
    const created = await createdSession({
      source: "EMBED",
      embedOrigin: "https://acme.example/team/onboarding?ref=email",
    });

    expect(created.embedOrigin).toBe("https://acme.example");
  });

  it("keeps a port the embedding page actually used", async () => {
    const created = await createdSession({
      source: "EMBED",
      embedOrigin: "https://acme.example:8443/learn",
    });

    expect(created.embedOrigin).toBe("https://acme.example:8443");
  });

  it("keeps www rather than folding it into the apex domain", async () => {
    const created = await createdSession({
      source: "EMBED",
      embedOrigin: "https://www.acme.example/learn",
    });

    expect(created.embedOrigin).toBe("https://www.acme.example");
  });

  it("stores no origin for a referrer that is not a URL", async () => {
    const created = await createdSession({
      source: "EMBED",
      embedOrigin: "acme.example",
    });

    expect(created).toMatchObject({
      sessionSource: "EMBED",
      embedOrigin: null,
    });
  });

  it("stores no origin for a non-HTTP scheme", async () => {
    const created = await createdSession({
      source: "EMBED",
      embedOrigin: "javascript:alert(1)",
    });

    expect(created.embedOrigin).toBeNull();
  });

  it("records an embedded session even when the origin is withheld", async () => {
    const created = await createdSession({
      source: "EMBED",
      embedOrigin: null,
    });

    expect(created).toMatchObject({
      sessionSource: "EMBED",
      embedOrigin: null,
    });
  });
});

describe("withAnonymousGradingRateLimit", () => {
  it("limits grading on the client IP first, then on the anonymous id", async () => {
    const gradingHeaders = new Headers({ "x-forwarded-for": "203.0.113.4" });

    await withAnonymousGradingRateLimit(
      gradingHeaders,
      "anon1",
      "anon.gradeScene",
      async () => "graded",
    );

    expect(withRateLimit.mock.calls.map(([options]) => options)).toEqual([
      expect.objectContaining({
        identifier: "203.0.113.4",
        endpoint: "anon.gradeScene",
        maxPerWindow: ANONYMOUS_GRADING_RATE_LIMIT_PER_IP_PER_HOUR,
      }),
      expect.objectContaining({
        identifier: "anon:anon1",
        endpoint: "anon.gradeScene",
        maxPerWindow: ANONYMOUS_GRADING_RATE_LIMIT_PER_LEARNER_PER_HOUR,
      }),
    ]);
    expect(ANONYMOUS_GRADING_RATE_LIMIT_PER_IP_PER_HOUR).toBeGreaterThan(
      ANONYMOUS_GRADING_RATE_LIMIT_PER_LEARNER_PER_HOUR,
    );
  });
});

describe("completeAnonymousLearningSession", () => {
  it("AC1: returns a COMPLETED session's recorded score unchanged", async () => {
    tx.anonymousCourseSession.findUnique.mockResolvedValue({
      id: "s1",
      status: "COMPLETED",
      triesUsed: 1,
      scorePct: 55,
    });

    const result = await completeAnonymousLearningSession(headers, {
      courseId: "c1",
      anonymousId: "anon1",
    });

    expect(result).toEqual({ success: true, scorePct: 55, passed: false });
    expect(tx.sceneAnalytics.findMany).not.toHaveBeenCalled();
    expect(tx.anonymousCourseSession.upsert).not.toHaveBeenCalled();
  });

  it("AC2/AC3: sums SP scoped to the session's active attempt and completes it", async () => {
    tx.anonymousCourseSession.findUnique.mockResolvedValue({
      id: "s1",
      status: "IN_PROGRESS",
      triesUsed: 0,
      scorePct: null,
    });
    tx.sceneAnalytics.findMany.mockResolvedValue([
      { spEarned: 30 },
      { spEarned: 40 },
    ]);
    tx.anonymousCourseSession.upsert.mockResolvedValue({ id: "s1" });

    const result = await completeAnonymousLearningSession(headers, {
      courseId: "c1",
      anonymousId: "anon1",
    });

    expect(tx.sceneAnalytics.findMany).toHaveBeenCalledWith({
      where: { anonymousSessionId: "s1", attempt: 1 },
      select: { spEarned: true },
    });
    expect(tx.anonymousCourseSession.upsert).toHaveBeenCalledWith({
      where: {
        anonymousId_courseVersionId: {
          anonymousId: "anon1",
          courseVersionId: "v1",
        },
      },
      update: expect.objectContaining({
        status: "COMPLETED",
        totalSpEarned: 70,
        scorePct: 70,
        triesUsed: { increment: 1 },
      }),
      create: expect.objectContaining({
        status: "COMPLETED",
        totalSpEarned: 70,
        scorePct: 70,
      }),
    });
    expect(result).toEqual({ success: true, scorePct: 70, passed: true });
  });

  it("AC4: treats a missing session as attempt 1 with zero SP earned", async () => {
    tx.anonymousCourseSession.findUnique.mockResolvedValue(null);
    tx.anonymousCourseSession.upsert.mockResolvedValue({ id: "s1" });

    const result = await completeAnonymousLearningSession(headers, {
      courseId: "c1",
      anonymousId: "anon1",
    });

    expect(tx.sceneAnalytics.findMany).not.toHaveBeenCalled();
    expect(tx.anonymousCourseSession.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          totalSpEarned: 0,
          scorePct: 0,
          triesUsed: 1,
        }),
      }),
    );
    expect(result).toEqual({ success: true, scorePct: 0, passed: false });
  });

  it("AC6: acquires the same anonymous-attempt lock scene completion uses", async () => {
    tx.anonymousCourseSession.findUnique.mockResolvedValue(null);
    tx.anonymousCourseSession.upsert.mockResolvedValue({ id: "s1" });

    await completeAnonymousLearningSession(headers, {
      courseId: "c1",
      anonymousId: "anon1",
    });

    expect(lockAnonymousAttempt).toHaveBeenCalledWith(tx, "anon1", "v1");
  });
});
