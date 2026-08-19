import { AppError } from "@scibly/api/application-error";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  course: {
    delete: vi.fn(),
    update: vi.fn(),
  },
  lesson: {
    findMany: vi.fn(),
    deleteMany: vi.fn(),
  },
}));

const coursePolicy = vi.hoisted(() => ({ requireCourseAdmin: vi.fn() }));

vi.mock("@scibly/db", () => ({ db }));
vi.mock("@/features/course-authoring/access/server/policy", () => coursePolicy);

const { deleteDraftLessons } = await import("./lessons");
const { deleteCourse } = await import("../../courses/server/courses");

const ADMIN = "user-admin";
const COURSE = "course-1";

function lesson(id: string, courseVersionId: string | null = null) {
  return { id, courseVersionId };
}

function forbidden() {
  return new AppError({
    code: "FORBIDDEN",
    applicationCode: "course.forbidden",
    message: "Forbidden.",
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  db.lesson.deleteMany.mockResolvedValue({ count: 0 });
  db.lesson.findMany.mockResolvedValue([]);
  db.course.update.mockResolvedValue({});
  db.course.delete.mockResolvedValue({});
});

describe("DC1/DC2 — deleting a whole course", () => {
  it("DC1: authorizes the caller as an administrator of the course", async () => {
    await deleteCourse(ADMIN, COURSE);

    expect(coursePolicy.requireCourseAdmin).toHaveBeenCalledWith(COURSE, ADMIN);
  });

  it("DC1: a caller who is refused deletes nothing", async () => {
    coursePolicy.requireCourseAdmin.mockRejectedValue(forbidden());

    await expect(deleteCourse(ADMIN, COURSE)).rejects.toThrow(AppError);
    expect(db.course.delete).not.toHaveBeenCalled();
  });

  it("DC2: deletes exactly the named course", async () => {
    const result = await deleteCourse(ADMIN, COURSE);

    expect(db.course.delete).toHaveBeenCalledWith({ where: { id: COURSE } });
    expect(result).toEqual({ success: true });
  });
});

describe("LD1 — authorization runs before any lesson is read", () => {
  it("LD1: authorizes against the course before loading its lessons", async () => {
    db.lesson.findMany.mockResolvedValueOnce([lesson("lesson-1")]);

    await deleteDraftLessons(ADMIN, {
      courseId: COURSE,
      lessonIds: ["lesson-1"],
    });

    expect(coursePolicy.requireCourseAdmin).toHaveBeenCalledWith(COURSE, ADMIN);
  });

  it("LD1: a refused caller learns nothing about which lesson ids exist", async () => {
    coursePolicy.requireCourseAdmin.mockRejectedValue(forbidden());

    await expect(
      deleteDraftLessons(ADMIN, { courseId: COURSE, lessonIds: ["lesson-1"] }),
    ).rejects.toThrow(AppError);
    expect(db.lesson.findMany).not.toHaveBeenCalled();
    expect(db.lesson.deleteMany).not.toHaveBeenCalled();
  });
});

describe("LD2/LD3 — which ids the batch may name", () => {
  it("LD2: refuses the whole batch when an id does not belong to this course", async () => {
    db.lesson.findMany.mockResolvedValueOnce([lesson("lesson-1")]);

    const result = await deleteDraftLessons(ADMIN, {
      courseId: COURSE,
      lessonIds: ["lesson-1", "lesson-elsewhere"],
    });

    expect(result.success).toBe(false);
    expect(result.success ? [] : result.missingLessonIds).toEqual([
      "lesson-elsewhere",
    ]);
    expect(db.lesson.deleteMany).not.toHaveBeenCalled();
  });

  it("LD2: a lesson belonging to another course is not visible through this one", async () => {
    db.lesson.findMany.mockResolvedValueOnce([]);

    await deleteDraftLessons(ADMIN, {
      courseId: COURSE,
      lessonIds: ["lesson-elsewhere"],
    });

    expect(db.lesson.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ courseId: COURSE }),
      }),
    );
  });

  it("LD2: names the ids and the way back, so the agent can retry", async () => {
    db.lesson.findMany.mockResolvedValueOnce([]);

    const result = await deleteDraftLessons(ADMIN, {
      courseId: COURSE,
      lessonIds: ["lesson-gone"],
    });

    expect(result.success ? "" : result.message).toContain("lesson-gone");
    expect(result.success ? "" : result.message).toContain("retry");
  });

  it("LD3: a duplicated id is treated as one", async () => {
    db.lesson.findMany.mockResolvedValueOnce([lesson("lesson-1")]);

    const result = await deleteDraftLessons(ADMIN, {
      courseId: COURSE,
      lessonIds: ["lesson-1", "lesson-1"],
    });

    expect(result.success).toBe(true);
    expect(db.lesson.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: { in: ["lesson-1"] } }),
      }),
    );
  });
});

describe("LD4 — a published lesson", () => {
  it("LD4: is refused, and takes the whole batch with it", async () => {
    db.lesson.findMany.mockResolvedValueOnce([
      lesson("lesson-1"),
      lesson("lesson-2", "version-1"),
    ]);

    const result = await deleteDraftLessons(ADMIN, {
      courseId: COURSE,
      lessonIds: ["lesson-1", "lesson-2"],
    });

    expect(result.success).toBe(false);
    expect(result.success ? [] : result.publishedLessonIds).toEqual([
      "lesson-2",
    ]);
    expect(db.lesson.deleteMany).not.toHaveBeenCalled();
  });
});

describe("LD5/LD6 — what a successful delete does", () => {
  it("LD5: deletes exactly the requested lessons, within this course only", async () => {
    db.lesson.findMany.mockResolvedValueOnce([
      lesson("lesson-1"),
      lesson("lesson-2"),
    ]);

    const result = await deleteDraftLessons(ADMIN, {
      courseId: COURSE,
      lessonIds: ["lesson-1", "lesson-2"],
    });

    expect(db.lesson.deleteMany).toHaveBeenCalledWith({
      where: {
        id: { in: ["lesson-1", "lesson-2"] },
        courseId: COURSE,
        courseVersionId: null,
      },
    });
    expect(result.success ? result.deletedLessonIds : []).toEqual([
      "lesson-1",
      "lesson-2",
    ]);
  });

  it("LD5: refuses at the delete itself to touch a lesson that became published", async () => {
    db.lesson.findMany.mockResolvedValueOnce([lesson("lesson-1")]);

    await deleteDraftLessons(ADMIN, {
      courseId: COURSE,
      lessonIds: ["lesson-1"],
    });

    const [call] = db.lesson.deleteMany.mock.calls;
    expect(call?.[0]?.where?.courseVersionId).toBeNull();
  });

  it("LD6: bumps the surviving course, so the next republish sees a change", async () => {
    db.lesson.findMany.mockResolvedValueOnce([lesson("lesson-1")]);

    await deleteDraftLessons(ADMIN, {
      courseId: COURSE,
      lessonIds: ["lesson-1"],
    });

    expect(db.course.update).toHaveBeenCalledWith({
      where: { id: COURSE },
      data: {},
    });
  });

  it("LD6: is not bumped when the batch was refused", async () => {
    db.lesson.findMany.mockResolvedValueOnce([lesson("lesson-1", "version-1")]);

    await deleteDraftLessons(ADMIN, {
      courseId: COURSE,
      lessonIds: ["lesson-1"],
    });

    expect(db.course.update).not.toHaveBeenCalled();
  });

  it("LD6/N3: a course may be emptied of every lesson — publish time is where that is refused", async () => {
    db.lesson.findMany.mockResolvedValueOnce([lesson("lesson-1")]);

    const result = await deleteDraftLessons(ADMIN, {
      courseId: COURSE,
      lessonIds: ["lesson-1"],
    });

    expect(result.success).toBe(true);
  });
});
