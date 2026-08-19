import { beforeEach, describe, expect, it, vi } from "vitest";

// db.$transaction is stubbed to resolve without invoking its callback, so
// only auth-before-write ordering is under test here — the order-rewrite
// logic itself is covered separately in ordering.test.ts.

const db = vi.hoisted(() => ({
  lesson: { findMany: vi.fn(), deleteMany: vi.fn() },
  course: { update: vi.fn() },
  $transaction: vi.fn(),
}));

const requireCourseAdmin = vi.hoisted(() => vi.fn());
const ensureDefaultIntroductionScene = vi.hoisted(() => vi.fn());

vi.mock("@scibly/db", () => ({ db }));
vi.mock("../../access/server/policy", () => ({ requireCourseAdmin }));
vi.mock("./ensure-default-introduction-scene", () => ({
  ensureDefaultIntroductionScene,
}));

const { createDraftLesson, deleteDraftLessons, reorderDraftLessons } =
  await import("./lessons");

beforeEach(() => {
  vi.clearAllMocks();
  requireCourseAdmin.mockResolvedValue({ id: "c1", organizationId: "orgA" });
  db.lesson.deleteMany.mockResolvedValue({ count: 0 });
  db.lesson.findMany.mockResolvedValue([]);
  db.course.update.mockResolvedValue({ id: "c1" });
  db.$transaction.mockResolvedValue(undefined);
});

function makeLesson(id: string, courseVersionId: string | null = null) {
  return { id, courseVersionId };
}

describe("createDraftLesson", () => {
  function withTransaction(draftLessonCount: number) {
    const tx = {
      lesson: {
        count: vi.fn().mockResolvedValue(draftLessonCount),
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: "l1" }),
      },
    };
    db.$transaction.mockImplementation((run) => run(tx));
    return tx;
  }

  it("refuses a second lesson in a lesson-mode course", async () => {
    requireCourseAdmin.mockResolvedValue({
      id: "c1",
      organizationId: "orgA",
      mode: "LESSON",
    });
    const tx = withTransaction(1);

    await expect(
      createDraftLesson("u1", { courseId: "c1", title: "Second" }),
    ).rejects.toMatchObject({
      applicationCode: "course.lesson_mode_is_full",
    });
    expect(tx.lesson.create).not.toHaveBeenCalled();
  });

  it("creates the one lesson a lesson-mode course is still missing", async () => {
    requireCourseAdmin.mockResolvedValue({
      id: "c1",
      organizationId: "orgA",
      mode: "LESSON",
    });
    const tx = withTransaction(0);

    await createDraftLesson("u1", { courseId: "c1", title: "First" });

    expect(tx.lesson.create).toHaveBeenCalled();
  });

  it("leaves course-mode courses uncounted and unblocked", async () => {
    requireCourseAdmin.mockResolvedValue({
      id: "c1",
      organizationId: "orgA",
      mode: "COURSE",
    });
    const tx = withTransaction(7);

    await createDraftLesson("u1", { courseId: "c1", title: "Eighth" });

    expect(tx.lesson.count).not.toHaveBeenCalled();
    expect(tx.lesson.create).toHaveBeenCalled();
  });
});

describe("deleteDraftLessons", () => {
  it("LD1: authorizes the caller as admin_or_owner of the course before loading any lesson data", async () => {
    db.lesson.findMany.mockResolvedValueOnce([makeLesson("l1")]);

    await deleteDraftLessons("u1", { courseId: "c1", lessonIds: ["l1"] });

    expect(requireCourseAdmin).toHaveBeenCalledWith("c1", "u1");
  });

  it("LD1: propagates FORBIDDEN before revealing missing or published lesson ids", async () => {
    requireCourseAdmin.mockRejectedValueOnce(
      Object.assign(new Error("forbidden"), { code: "FORBIDDEN" }),
    );

    await expect(
      deleteDraftLessons("u1", { courseId: "c1", lessonIds: ["missing"] }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.lesson.findMany).not.toHaveBeenCalled();
  });

  it("LD2: refuses a batch containing an id that doesn't belong to this course, deleting nothing", async () => {
    db.lesson.findMany.mockResolvedValueOnce([makeLesson("l1")]);

    await expect(
      deleteDraftLessons("u1", {
        courseId: "c1",
        lessonIds: ["l1", "missing"],
      }),
    ).resolves.toMatchObject({
      success: false,
      missingLessonIds: ["missing"],
    });
    expect(db.lesson.deleteMany).not.toHaveBeenCalled();
  });

  it("LD3: deduplicates repeated ids in the input before loading or deleting", async () => {
    db.lesson.findMany.mockResolvedValueOnce([makeLesson("l1")]);

    await deleteDraftLessons("u1", {
      courseId: "c1",
      lessonIds: ["l1", "l1"],
    });

    expect(db.lesson.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ["l1"] }, courseId: "c1" },
      }),
    );
  });

  it("LD4: refuses deleting a lesson that is already published, deleting nothing", async () => {
    db.lesson.findMany.mockResolvedValueOnce([
      makeLesson("l1"),
      makeLesson("l2", "cv1"),
    ]);

    await expect(
      deleteDraftLessons("u1", { courseId: "c1", lessonIds: ["l1", "l2"] }),
    ).resolves.toMatchObject({
      success: false,
      publishedLessonIds: ["l2"],
    });
    expect(db.lesson.deleteMany).not.toHaveBeenCalled();
  });

  it("LD5: on success, deletes exactly the requested lessons and returns their ids", async () => {
    db.lesson.findMany.mockResolvedValueOnce([
      makeLesson("l1"),
      makeLesson("l2"),
    ]);

    const result = await deleteDraftLessons("u1", {
      courseId: "c1",
      lessonIds: ["l1", "l2"],
    });

    expect(db.lesson.deleteMany).toHaveBeenCalledWith({
      where: {
        id: { in: ["l1", "l2"] },
        courseId: "c1",
        courseVersionId: null,
      },
    });
    expect(result).toEqual({
      success: true,
      deletedLessonIds: ["l1", "l2"],
      courseId: "c1",
    });
  });

  it("LD6: on success, bumps the course's updatedAt", async () => {
    db.lesson.findMany.mockResolvedValueOnce([makeLesson("l1")]);

    await deleteDraftLessons("u1", { courseId: "c1", lessonIds: ["l1"] });

    expect(db.course.update).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: {},
    });
  });
});

describe("reorderDraftLessons", () => {
  it("W1: authorizes the caller as admin_or_owner of the course before rewriting order", async () => {
    await reorderDraftLessons("u1", {
      courseId: "c1",
      lessonIds: ["l1", "l2"],
    });

    expect(requireCourseAdmin).toHaveBeenCalledWith("c1", "u1");
    expect(db.$transaction).toHaveBeenCalled();
  });

  it("W1: propagates FORBIDDEN from requireCourseAdmin without opening a transaction", async () => {
    requireCourseAdmin.mockRejectedValueOnce(
      Object.assign(new Error("forbidden"), { code: "FORBIDDEN" }),
    );

    await expect(
      reorderDraftLessons("u1", { courseId: "c1", lessonIds: ["l1"] }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});
