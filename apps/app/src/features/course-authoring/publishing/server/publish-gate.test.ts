import { AppError } from "@scibly/api/application-error";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { transactionsRun } from "@/shared/testing/prisma-transaction";

// The gate runs for real against the doubled database; the snapshot it guards is doubled.
const db = vi.hoisted(() => ({
  organizationSubscription: { findUnique: vi.fn() },
  $transaction: vi.fn(),
}));

const access = vi.hoisted(() => ({ requireCourseAdmin: vi.fn() }));
const snapshot = vi.hoisted(() => ({ publishCourseSnapshot: vi.fn() }));

vi.mock("@scibly/db", () => ({ db }));
vi.mock("../../access/server/policy", () => access);
vi.mock("./publish-course-snapshot", () => snapshot);

const { publishCourse } = await import("./publish-course");

const COURSE = "course-1";
const ORG = "org-1";
const ADMIN = "user-admin";

function onPlan(plan: string, status = "ACTIVE") {
  db.organizationSubscription.findUnique.mockResolvedValue({
    plan,
    status,
    purchasedLearnerSeats: 0,
  });
}

function publish() {
  return publishCourse(ADMIN, { courseId: COURSE, supersedePrevious: false });
}

async function refusal(call: () => Promise<unknown>) {
  try {
    await call();
  } catch (error) {
    if (error instanceof AppError) return error;
    throw error;
  }
  throw new Error("expected the publish to be refused, but it resolved");
}

beforeEach(() => {
  vi.clearAllMocks();
  onPlan("STARTER");
  access.requireCourseAdmin.mockResolvedValue({
    id: COURSE,
    organizationId: ORG,
    updatedAt: new Date("2026-08-01T00:00:00Z"),
  });
  snapshot.publishCourseSnapshot.mockResolvedValue({ version: 3 });
  transactionsRun(db, { courseVersion: {} });
});

describe("PW1 — publishing is included in every plan, a lapse withdraws it", () => {
  it("lets a trial organization publish", async () => {
    onPlan("TRIAL");

    await expect(publish()).resolves.toEqual({ success: true, version: 3 });
  });

  it("refuses an organization whose subscription has lapsed", async () => {
    onPlan("BUSINESS", "CANCELED");

    const error = await refusal(publish);

    expect(error.message).toMatch(/lapsed/i);
    expect(snapshot.publishCourseSnapshot).not.toHaveBeenCalled();
  });

  it("PW1: authorization still runs first — a stranger is refused as one, not billed at", async () => {
    onPlan("TRIAL");
    access.requireCourseAdmin.mockRejectedValueOnce(
      new AppError({
        code: "FORBIDDEN",
        applicationCode: "course.forbidden",
        message: "Not an admin of this course.",
      }),
    );

    const error = await refusal(publish);

    expect(error.code).toBe("FORBIDDEN");
    expect(db.organizationSubscription.findUnique).not.toHaveBeenCalled();
  });
});

describe("PW2 — the organization gated is the validated course's own", () => {
  it("reads the plan of the organization authorization resolved, never request input", async () => {
    await publish();

    expect(db.organizationSubscription.findUnique).toHaveBeenCalledWith({
      where: { organizationId: ORG },
      select: {
        plan: true,
        purchasedLearnerSeats: true,
        status: true,
        pastDueSince: true,
        currentPeriodStart: true,
      },
    });
  });
});

describe("PW3 — a subscribed organization publishes exactly as before", () => {
  it("commits the snapshot and reports its version", async () => {
    await expect(publish()).resolves.toEqual({ success: true, version: 3 });

    expect(snapshot.publishCourseSnapshot).toHaveBeenCalledTimes(1);
    const [, course, userId, options] =
      snapshot.publishCourseSnapshot.mock.calls[0];
    expect(course).toMatchObject({ id: COURSE, organizationId: ORG });
    expect(userId).toBe(ADMIN);
    expect(options).toEqual({ supersedePrevious: false, force: undefined });
  });

  it("publishes on every billed plan", async () => {
    for (const plan of ["STARTER", "BUSINESS", "PRO", "INTERNAL"]) {
      onPlan(plan);

      await expect(publish()).resolves.toEqual({ success: true, version: 3 });
    }
  });
});
