import { beforeEach, describe, expect, it, vi } from "vitest";

// The db is mocked; getActiveAttempt is a pure function and runs for real.

const db = vi.hoisted(() => ({
  courseEnrollment: { count: vi.fn(), findMany: vi.fn() },
  sceneProgress: { findMany: vi.fn() },
  scene: { groupBy: vi.fn() },
}));

vi.mock("@scibly/db", () => ({ db }));

const { listEnrollmentsHelper } = await import("./list-enrollments");

const MAKE_ENROLLMENT = {
  id: "e1",
  userId: "u1",
  user: { name: "Ann", email: "ann@example.com", image: null },
  courseVersion: { version: 3 },
  courseVersionId: "v3",
  certificate: null as { id: string } | null,
  status: "IN_PROGRESS",
  lastActive: new Date("2026-07-01"),
  createdAt: new Date("2026-06-01"),
  triesUsed: 0,
};

function makeEnrollment(overrides: Partial<typeof MAKE_ENROLLMENT> = {}) {
  return { ...MAKE_ENROLLMENT, ...overrides };
}

const baseInput = {
  courseId: "c1",
  limit: 10,
  cursor: null as number | null,
  search: undefined as string | undefined,
  status: "all" as const,
};
const baseCourse = { maxTries: 3 };

beforeEach(() => {
  vi.clearAllMocks();
  db.courseEnrollment.count.mockResolvedValue(0);
  db.courseEnrollment.findMany.mockResolvedValue([]);
  db.sceneProgress.findMany.mockResolvedValue([]);
  db.scene.groupBy.mockResolvedValue([]);
});

describe("listEnrollmentsHelper", () => {
  it("LE1: only queries enrollments for the given course with a non-null userId", async () => {
    await listEnrollmentsHelper(baseInput, baseCourse);

    expect(db.courseEnrollment.count).toHaveBeenCalledWith({
      where: { courseId: "c1", userId: { not: null } },
    });
    expect(db.courseEnrollment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { courseId: "c1", userId: { not: null } },
      }),
    );
  });

  it("LE2: filters by status when it isn't 'all'", async () => {
    await listEnrollmentsHelper(
      { ...baseInput, status: "COMPLETED" },
      baseCourse,
    );

    expect(db.courseEnrollment.count).toHaveBeenCalledWith({
      where: { courseId: "c1", userId: { not: null }, status: "COMPLETED" },
    });
  });

  it("LE3: filters by case-insensitive search over the enrolled user's name or email", async () => {
    await listEnrollmentsHelper({ ...baseInput, search: "ann" }, baseCourse);

    expect(db.courseEnrollment.count).toHaveBeenCalledWith({
      where: {
        courseId: "c1",
        userId: { not: null },
        user: {
          OR: [
            { name: { contains: "ann", mode: "insensitive" } },
            { email: { contains: "ann", mode: "insensitive" } },
          ],
        },
      },
    });
  });

  it("LE4: counts completed scenes scoped to the enrollment's own active attempt", async () => {
    const enrollment = makeEnrollment({ triesUsed: 2, status: "IN_PROGRESS" });
    db.courseEnrollment.findMany.mockResolvedValue([enrollment]);
    db.scene.groupBy.mockResolvedValue([
      { courseVersionId: "v3", _count: { id: 4 } },
    ]);
    db.sceneProgress.findMany.mockResolvedValue([
      { enrollmentId: "e1", attempt: 3 },
      { enrollmentId: "e1", attempt: 3 },

      { enrollmentId: "e1", attempt: 1 },
      { enrollmentId: "e1", attempt: 1 },
      { enrollmentId: "e1", attempt: 1 },
    ]);

    const result = await listEnrollmentsHelper(baseInput, baseCourse);

    expect(db.sceneProgress.findMany).toHaveBeenCalledWith({
      where: { enrollmentId: { in: ["e1"] }, status: "COMPLETED" },
      select: { enrollmentId: true, attempt: true },
    });
    expect(result.items[0]?.progress).toBe(50);
  });

  it("LE5: hasCertificate reflects the enrollment's linked certificate", async () => {
    db.courseEnrollment.findMany.mockResolvedValue([
      makeEnrollment({ id: "e1", certificate: { id: "cert1" } }),
      makeEnrollment({ id: "e2", certificate: null }),
    ]);

    const result = await listEnrollmentsHelper(baseInput, baseCourse);

    expect(result.items.find((i) => i.id === "e1")?.hasCertificate).toBe(true);
    expect(result.items.find((i) => i.id === "e2")?.hasCertificate).toBe(false);
  });

  it("LE6: computes totalScenesCount per enrollment's own courseVersionId", async () => {
    db.courseEnrollment.findMany.mockResolvedValue([
      makeEnrollment({ id: "e1", courseVersionId: "v1", triesUsed: 0 }),
      makeEnrollment({ id: "e2", courseVersionId: "v2", triesUsed: 0 }),
    ]);
    db.scene.groupBy.mockResolvedValue([
      { courseVersionId: "v1", _count: { id: 5 } },
      { courseVersionId: "v2", _count: { id: 10 } },
    ]);
    db.sceneProgress.findMany.mockResolvedValue([
      { enrollmentId: "e1", attempt: 1 },
      { enrollmentId: "e2", attempt: 1 },
    ]);

    const result = await listEnrollmentsHelper(baseInput, baseCourse);

    expect(result.items.find((i) => i.id === "e1")?.progress).toBe(20);
    expect(result.items.find((i) => i.id === "e2")?.progress).toBe(10);
  });

  it("LE7: totalCount reflects the filtered total independent of an empty current page", async () => {
    db.courseEnrollment.count.mockResolvedValue(7);
    db.courseEnrollment.findMany.mockResolvedValue([]);

    const result = await listEnrollmentsHelper(
      { ...baseInput, cursor: 100 },
      baseCourse,
    );

    expect(result.totalCount).toBe(7);
    expect(result.items).toEqual([]);
  });

  it("LE8: reports progress 0 rather than dividing by zero when the version has no scenes", async () => {
    db.courseEnrollment.findMany.mockResolvedValue([makeEnrollment()]);
    db.scene.groupBy.mockResolvedValue([]);

    const result = await listEnrollmentsHelper(baseInput, baseCourse);

    expect(result.items[0]?.progress).toBe(0);
  });

  it("paginates: returns nextCursor only when more rows exist beyond the page", async () => {
    db.courseEnrollment.findMany.mockResolvedValue([
      makeEnrollment({ id: "e1" }),
      makeEnrollment({ id: "e2" }),
      makeEnrollment({ id: "e3" }),
    ]);

    const result = await listEnrollmentsHelper(
      { ...baseInput, limit: 2, cursor: 0 },
      baseCourse,
    );

    expect(result.items).toHaveLength(2);
    expect(result.nextCursor).toBe(2);
  });

  it("passes through the course's maxTries unchanged", async () => {
    const result = await listEnrollmentsHelper(baseInput, { maxTries: 5 });

    expect(result.maxTries).toBe(5);
  });
});
