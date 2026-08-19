import type * as RateLimitModule from "@scibly/api/rate-limit";
import type * as DbModule from "@scibly/db";

import { AppError } from "@scibly/api/application-error";
import { PLAN_CATALOGUE } from "@scibly/ee-billing/plan-catalogue";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { transactionsRun } from "@/shared/testing/prisma-transaction";

// The plan catalogue is real — which number the plan says is the whole point of a ceiling, so mocking it would test nothing.
// Only the database, the locks, the rate limit and the mail transport are doubled.
const db = vi.hoisted(() => ({
  organizationSubscription: { findUnique: vi.fn(), updateMany: vi.fn() },
  course: { count: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
  anonymousCourseSession: {
    count: vi.fn(),
    findUnique: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
  },
  courseEnrollment: { findMany: vi.fn(), create: vi.fn() },
  organizationCredit: { updateMany: vi.fn() },
  creditLedgerEntry: { create: vi.fn() },
  organization: { findUnique: vi.fn() },
  member: { findMany: vi.fn() },
  $transaction: vi.fn(),
}));

const access = vi.hoisted(() => ({
  requireCourseAdmin: vi.fn(),
  requireCourseEnrollment: vi.fn(),
}));
const organizations = vi.hoisted(() => ({
  requireOrganizationBySlug: vi.fn(),
  requireOrgMember: vi.fn(),
}));
const locks = vi.hoisted(() => ({
  lockAnonymousAttempt: vi.fn(),
  lockNotebookCourseLink: vi.fn(),
}));
const publicCourse = vi.hoisted(() => ({
  requireAnonymousCourse: vi.fn(),
  getLatestCourseVersion: vi.fn(),
}));
const mail = vi.hoisted(() => ({ sendEmail: vi.fn() }));

const scheduled = vi.hoisted(() => [] as (() => unknown)[]);

vi.mock("@scibly/db", async (importOriginal) => ({
  ...(await importOriginal<typeof DbModule>()),
  db,
}));
// Only the limiter is stubbed — the module also exports TimeHelpers, which the
// entitlement policy reads at call time, so replacing the whole module would break every path through the gate.
vi.mock("@scibly/api/rate-limit", async (importOriginal) => ({
  ...(await importOriginal<typeof RateLimitModule>()),
  withRateLimit: (_options: unknown, operation: () => Promise<unknown>) =>
    operation(),
}));
vi.mock("@scibly/email/resend", () => ({ default: mail.sendEmail }));
vi.mock("next/server", () => ({
  after: (callback: () => unknown) => scheduled.push(callback),
}));
vi.mock("@scibly/email/templates/public-session-ceiling-mail", () => ({
  default: vi.fn(() => null),
}));
vi.mock("@/features/course-authoring/access/server/policy", () => access);
// The organization barrel is doubled for the membership policy, but the mailer behind it is the thing under test here — so it comes from the real module, which picks up the database and transport doubles above.
vi.mock("@/features/organizations/server", async () => {
  const notices = await import("@/features/organizations/server/notify-owners");
  return {
    ...organizations,
    notifyOwners: notices.notifyOwners,
    notifyAfterResponding: notices.notifyAfterResponding,
  };
});
vi.mock("@/lib/db/transaction-locks", () => locks);
vi.mock("./public-course", () => publicCourse);

const { updateCourse } =
  await import("@/features/course-authoring/courses/server/courses");
const { startAnonymousLearningSession } = await import("./anonymous-session");

const ORG = "org-1";
const COURSE = "course-1";
const ADMIN = "user-admin";
const VISITOR = "anon-cookie-1";
const VERSION = "cv-1";
const PERIOD_START = new Date("2026-08-01T00:00:00Z");

const CEILING = PLAN_CATALOGUE.STARTER.anonymousSessionsPerPeriod;
const PUBLIC_COURSES = PLAN_CATALOGUE.STARTER.publicCourses;

const WARN_AT = Math.ceil(CEILING * 0.8);

function onPlan(plan: string | null) {
  db.organizationSubscription.findUnique.mockResolvedValue(
    plan === null
      ? null
      : {
          plan,
          status: "ACTIVE",
          purchasedLearnerSeats: 0,
          currentPeriodStart: PERIOD_START,
        },
  );
}

function publiclyLinked(count: number) {
  db.course.count.mockResolvedValue(count);
}

function startedThisPeriod(count: number) {
  db.anonymousCourseSession.count.mockReset();
  db.anonymousCourseSession.count.mockResolvedValue(count);
}

async function flushScheduled() {
  for (const callback of scheduled.splice(0, scheduled.length)) {
    await callback();
  }
}

function publish(allowAnonymous?: boolean) {
  return updateCourse(ADMIN, { courseId: COURSE, allowAnonymous });
}

function visit(reset = false) {
  return startAnonymousLearningSession(new Headers(), {
    courseId: COURSE,
    anonymousId: VISITOR,
    reset,
  });
}

async function refusal(call: () => Promise<unknown>) {
  try {
    await call();
  } catch (error) {
    if (error instanceof AppError) return error;
    throw error;
  }
  throw new Error("expected the write to be refused, but it resolved");
}

beforeEach(() => {
  vi.resetAllMocks();
  scheduled.length = 0;

  onPlan("STARTER");
  publiclyLinked(0);
  startedThisPeriod(0);
  access.requireCourseAdmin.mockResolvedValue({
    id: COURSE,
    organizationId: ORG,
  });
  db.course.update.mockResolvedValue({ id: COURSE, allowAnonymous: true });
  publicCourse.requireAnonymousCourse.mockResolvedValue({
    id: COURSE,
    organizationId: ORG,
    allowAnonymous: true,
    maxTries: null,
    passingScorePct: null,
  });
  publicCourse.getLatestCourseVersion.mockResolvedValue({
    id: VERSION,
    version: 1,
  });
  db.anonymousCourseSession.findUnique.mockResolvedValue(null);
  db.anonymousCourseSession.upsert.mockResolvedValue({ id: "session-1" });
  db.organization.findUnique.mockResolvedValue({ name: "Acme", slug: "acme" });
  db.member.findMany.mockResolvedValue([]);

  db.organizationSubscription.updateMany.mockResolvedValue({ count: 1 });
  transactionsRun(db);
});

describe("PC1 — the public-course cap is the plan's own number", () => {
  it("permits the link that fills the cap and refuses the next", async () => {
    publiclyLinked(PUBLIC_COURSES - 1);
    await expect(publish(true)).resolves.toMatchObject({ id: COURSE });

    publiclyLinked(PUBLIC_COURSES);
    db.course.update.mockClear();
    const error = await refusal(() => publish(true));

    expect(error.code).toBe("PAYMENT_REQUIRED");
    expect(error.applicationCode).toBe("entitlement.public_courses_exhausted");
    expect(error.details).toEqual({ shortfall: 1, remainingPublicCourses: 0 });
    expect(db.course.update).not.toHaveBeenCalled();
  });

  it("refuses at that same count on the most expensive plan — every plan includes the same number today", async () => {
    onPlan("PRO");
    publiclyLinked(PLAN_CATALOGUE.PRO.publicCourses);

    expect((await refusal(() => publish(true))).code).toBe("PAYMENT_REQUIRED");
  });

  it("counts the organization's open links, excluding this course", async () => {
    await publish(true);

    expect(db.course.count).toHaveBeenCalledWith({
      where: { organizationId: ORG, allowAnonymous: true, id: { not: COURSE } },
    });
  });

  it("PC8: an organization with no subscription is refused and writes nothing", async () => {
    onPlan(null);

    const error = await refusal(() => publish(true));

    expect(error.applicationCode).toBe("entitlement.unresolvable");
    expect(db.course.update).not.toHaveBeenCalled();
  });

  it("PC9: the internal plan traverses the same count with an unreachable number", async () => {
    onPlan("INTERNAL");
    publiclyLinked(100_000);

    await expect(publish(true)).resolves.toMatchObject({ id: COURSE });
    expect(db.course.count).toHaveBeenCalledTimes(1);
  });

  it("never counts a write that does not turn the link on", async () => {
    publiclyLinked(PUBLIC_COURSES);

    await expect(publish(false)).resolves.toMatchObject({ id: COURSE });
    await expect(
      updateCourse(ADMIN, { courseId: COURSE, title: "Renamed" }),
    ).resolves.toMatchObject({ id: COURSE });
    expect(db.course.count).not.toHaveBeenCalled();
  });
});

describe("PS1/PS2 — the session ceiling counts this period's starts", () => {
  it("counts the organization's sessions since the subscription's period start", async () => {
    await visit();

    expect(db.anonymousCourseSession.count).toHaveBeenCalledWith({
      where: {
        course: { organizationId: ORG },
        startedAt: { gte: PERIOD_START },
      },
    });
  });

  it("permits the session that exactly fills the ceiling and refuses the next", async () => {
    startedThisPeriod(CEILING - 1);
    await expect(visit()).resolves.toMatchObject({ sessionId: "session-1" });

    startedThisPeriod(CEILING);
    expect((await refusal(visit)).code).toBe("SERVICE_UNAVAILABLE");
  });

  it("refuses at that same count on the most expensive plan — every billed plan sells the same number today", async () => {
    onPlan("PRO");
    startedThisPeriod(PLAN_CATALOGUE.PRO.anonymousSessionsPerPeriod);

    expect((await refusal(visit)).code).toBe("SERVICE_UNAVAILABLE");
  });
});

describe("PS3 — the ceiling counts starts, so it never cuts off a visitor mid-course", () => {
  it("resumes an existing session at the ceiling without consulting it", async () => {
    db.anonymousCourseSession.findUnique.mockResolvedValue({
      id: "session-existing",
      status: "IN_PROGRESS",
      scorePct: null,
      triesUsed: 1,
    });
    db.anonymousCourseSession.update.mockResolvedValue({
      id: "session-existing",
    });
    startedThisPeriod(CEILING);

    await expect(visit()).resolves.toMatchObject({
      sessionId: "session-existing",
    });
    expect(db.anonymousCourseSession.count).not.toHaveBeenCalled();
  });

  it("returns a completed session unchanged at the ceiling", async () => {
    db.anonymousCourseSession.findUnique.mockResolvedValue({
      id: "session-done",
      status: "COMPLETED",
      scorePct: 80,
      triesUsed: 1,
    });
    startedThisPeriod(CEILING);

    await expect(visit()).resolves.toMatchObject({
      sessionId: "session-done",
    });
    expect(db.anonymousCourseSession.count).not.toHaveBeenCalled();
  });
});

describe("PS4/PS5 — the refusal a stranger reads", () => {
  it("reports unavailability rather than a bill, and creates no session", async () => {
    startedThisPeriod(CEILING);

    const error = await refusal(visit);

    expect(error.code).toBe("SERVICE_UNAVAILABLE");
    expect(error.applicationCode).toBe("entitlement.public_sessions_exhausted");
    expect(db.anonymousCourseSession.upsert).not.toHaveBeenCalled();
  });

  it("names no plan, no limit and no number", async () => {
    startedThisPeriod(CEILING);

    const { message } = await refusal(visit);

    expect(message).not.toMatch(/\d/);
    expect(message).not.toMatch(/plan|limit|quota|upgrade|subscri/i);
  });

  it("publishes no details, which travel to the same stranger as the message", async () => {
    startedThisPeriod(CEILING);

    const { details } = await refusal(visit);

    expect(details).toBeUndefined();
  });
});

describe("PL19/PL21 — a lapse stops new sessions and leaves the ones underway", () => {
  function pastDueFor(days: number) {
    db.organizationSubscription.findUnique.mockResolvedValue({
      plan: "STARTER",
      status: "PAST_DUE",
      purchasedLearnerSeats: 0,
      pastDueSince: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      currentPeriodStart: PERIOD_START,
    });
  }

  it("PL13: a visitor still starts a session inside the grace period", async () => {
    pastDueFor(13);

    await expect(visit()).resolves.toMatchObject({ sessionId: "session-1" });
  });

  it("PL19: refuses a new session once grace has run out, well under the ceiling", async () => {
    pastDueFor(15);

    const error = await refusal(visit);

    expect(error.applicationCode).toBe("entitlement.public_sessions_exhausted");
    expect(db.anonymousCourseSession.upsert).not.toHaveBeenCalled();
  });

  it("PL21: a visitor already underway resumes, without the subscription being asked", async () => {
    pastDueFor(15);
    db.anonymousCourseSession.findUnique.mockResolvedValue({
      id: "session-existing",
      status: "IN_PROGRESS",
      scorePct: null,
      triesUsed: 1,
    });
    db.anonymousCourseSession.update.mockResolvedValue({
      id: "session-existing",
    });

    await expect(visit()).resolves.toMatchObject({
      sessionId: "session-existing",
    });
    expect(db.organizationSubscription.findUnique).not.toHaveBeenCalled();
  });
});

describe("PS7/PS8 — fail closed, no bypass", () => {
  it("PS7: a visitor is refused when the organization's plan cannot be resolved", async () => {
    onPlan(null);

    const error = await refusal(visit);

    expect(error.applicationCode).toBe("entitlement.unresolvable");
    expect(db.anonymousCourseSession.upsert).not.toHaveBeenCalled();
  });

  it("PS8: the internal plan traverses the same count with an unreachable number", async () => {
    onPlan("INTERNAL");
    startedThisPeriod(100_000);

    await expect(visit()).resolves.toMatchObject({ sessionId: "session-1" });
    expect(db.anonymousCourseSession.count).toHaveBeenCalled();
  });
});

describe("PW1/PW2 — the approach warning fires on the crossing, once", () => {
  it("warns the owners and admins when the new session lands on 80% of the ceiling", async () => {
    db.member.findMany.mockResolvedValue([
      { user: { email: "owner@acme.test" } },
      { user: { email: "admin@acme.test" } },
    ]);

    startedThisPeriod(WARN_AT - 1);

    await visit();
    await flushScheduled();

    expect(mail.sendEmail).toHaveBeenCalledTimes(2);
    expect(mail.sendEmail.mock.calls.map(([options]) => options.to)).toEqual([
      "owner@acme.test",
      "admin@acme.test",
    ]);
  });

  it("PW1: judges the crossing on the count the cap already took, never a second one", async () => {
    startedThisPeriod(WARN_AT - 1);

    await visit();
    await flushScheduled();

    expect(db.anonymousCourseSession.count).toHaveBeenCalledTimes(1);
  });

  it("stays quiet below the threshold", async () => {
    db.member.findMany.mockResolvedValue([
      { user: { email: "owner@acme.test" } },
    ]);
    startedThisPeriod(WARN_AT - 2);

    await visit();
    await flushScheduled();

    expect(mail.sendEmail).not.toHaveBeenCalled();
  });

  it("PW2: warns the session that steps over the line without landing on it", async () => {
    db.member.findMany.mockResolvedValue([
      { user: { email: "owner@acme.test" } },
    ]);

    startedThisPeriod(WARN_AT);

    await visit();
    await flushScheduled();

    expect(mail.sendEmail).toHaveBeenCalledTimes(1);
  });

  it("PW2: stays quiet on every session after the one that claimed the period", async () => {
    db.member.findMany.mockResolvedValue([
      { user: { email: "owner@acme.test" } },
    ]);
    db.organizationSubscription.updateMany.mockResolvedValue({ count: 0 });
    startedThisPeriod(WARN_AT + 50);

    await visit();
    await flushScheduled();

    expect(mail.sendEmail).not.toHaveBeenCalled();
  });

  it("PW2: claims the period the count was taken in, not merely the organization", async () => {
    startedThisPeriod(WARN_AT - 1);

    await visit();
    await flushScheduled();

    expect(db.organizationSubscription.updateMany).toHaveBeenCalledWith({
      where: {
        organizationId: ORG,
        currentPeriodStart: PERIOD_START,
        OR: [
          { sessionCeilingWarnedFor: null },
          { sessionCeilingWarnedFor: { not: PERIOD_START } },
        ],
      },
      data: { sessionCeilingWarnedFor: PERIOD_START },
    });
  });

  it("PW2: claims nothing below the threshold", async () => {
    startedThisPeriod(WARN_AT - 2);

    await visit();
    await flushScheduled();

    expect(db.organizationSubscription.updateMany).not.toHaveBeenCalled();
  });

  it("does not warn when the session was resumed rather than started", async () => {
    db.anonymousCourseSession.findUnique.mockResolvedValue({
      id: "session-existing",
      status: "IN_PROGRESS",
      scorePct: null,
      triesUsed: 1,
    });
    db.anonymousCourseSession.update.mockResolvedValue({
      id: "session-existing",
    });
    startedThisPeriod(WARN_AT);

    await visit();
    await flushScheduled();

    expect(mail.sendEmail).not.toHaveBeenCalled();
  });
});

describe("PW3/PW4 — who is written to, and what a failure costs", () => {
  it("PW3: only an owner who accepts email is written to", async () => {
    startedThisPeriod(WARN_AT - 1);

    await visit();
    await flushScheduled();

    expect(db.member.findMany).toHaveBeenCalledWith({
      where: {
        organizationId: ORG,
        role: "owner",
        user: { emailNotifications: true },
      },
      select: { user: { select: { email: true } } },
    });
  });

  it("PW4: the visitor's response does not wait on the mail — it goes out behind it", async () => {
    db.member.findMany.mockResolvedValue([
      { user: { email: "owner@acme.test" } },
    ]);
    startedThisPeriod(WARN_AT - 1);

    await visit();

    expect(mail.sendEmail).not.toHaveBeenCalled();
    await flushScheduled();
    expect(mail.sendEmail).toHaveBeenCalledTimes(1);
  });

  it("PW4: a mail failure never breaks the visitor's session", async () => {
    db.member.findMany.mockResolvedValue([
      { user: { email: "owner@acme.test" } },
    ]);
    mail.sendEmail.mockRejectedValue(new Error("Resend is down"));
    startedThisPeriod(WARN_AT - 1);

    await expect(visit()).resolves.toMatchObject({ sessionId: "session-1" });
    await expect(flushScheduled()).resolves.toBeUndefined();
  });
});

describe("PN1/PN2/PN3 — what an anonymous session never costs", () => {
  it("PN1: starting one writes no enrollment, so it takes no learner seat", async () => {
    await visit();

    expect(db.courseEnrollment.create).not.toHaveBeenCalled();
    expect(db.courseEnrollment.findMany).not.toHaveBeenCalled();
  });

  it("PN2/PN3: neither a permitted nor a refused session debits or records anything", async () => {
    await visit();
    startedThisPeriod(CEILING);
    await refusal(visit);

    expect(db.organizationCredit.updateMany).not.toHaveBeenCalled();
    expect(db.creditLedgerEntry.create).not.toHaveBeenCalled();
  });

  it("PN3: publishing a public course spends nothing either", async () => {
    await publish(true);

    expect(db.organizationCredit.updateMany).not.toHaveBeenCalled();
    expect(db.creditLedgerEntry.create).not.toHaveBeenCalled();
  });

  it("the session the visitor gets back says nothing about the ceiling", async () => {
    const session = await visit();

    expect(Object.keys(session).sort()).toEqual([
      "courseVersionId",
      "sessionId",
    ]);
  });
});
