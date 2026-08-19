import { beforeEach, describe, expect, it, vi } from "vitest";

// Db and requireCourseAdmin are doubled.
const db = vi.hoisted(() => ({
  course: { delete: vi.fn(), update: vi.fn() },
  lesson: { count: vi.fn() },
}));

const requireCourseAdmin = vi.hoisted(() => vi.fn());

vi.mock("@scibly/db", () => ({ db }));
vi.mock("../../access/server/policy", () => ({ requireCourseAdmin }));

const { deleteCourse, updateCourse } = await import("./courses");

beforeEach(() => {
  vi.clearAllMocks();
  requireCourseAdmin.mockResolvedValue({ id: "c1", organizationId: "orgA" });
  db.course.delete.mockResolvedValue({ id: "c1" });
  db.course.update.mockResolvedValue({ id: "c1" });
  db.lesson.count.mockResolvedValue(1);
});

describe("deleteCourse", () => {
  it("DC1: authorizes the caller as admin_or_owner of the course's organization before deleting", async () => {
    await deleteCourse("u1", "c1");

    expect(requireCourseAdmin).toHaveBeenCalledWith("c1", "u1");
    expect(db.course.delete).toHaveBeenCalledWith({ where: { id: "c1" } });
  });

  it("DC1: propagates NOT_FOUND from requireCourseAdmin without deleting anything", async () => {
    requireCourseAdmin.mockRejectedValueOnce(
      Object.assign(new Error("not found"), { code: "NOT_FOUND" }),
    );

    await expect(deleteCourse("u1", "missing")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(db.course.delete).not.toHaveBeenCalled();
  });

  it("DC1: propagates FORBIDDEN from requireCourseAdmin without deleting anything", async () => {
    requireCourseAdmin.mockRejectedValueOnce(
      Object.assign(new Error("forbidden"), { code: "FORBIDDEN" }),
    );

    await expect(deleteCourse("u1", "c1")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(db.course.delete).not.toHaveBeenCalled();
  });

  it("DC2: on success, deletes exactly the given course and returns success", async () => {
    await expect(deleteCourse("u1", "c1")).resolves.toEqual({
      success: true,
    });
  });
});

describe("updateCourse", () => {
  it("writes an uploaded thumbnail url to the course", async () => {
    await updateCourse("u1", {
      courseId: "c1",
      thumbnail: "https://s3/x.webp",
    });

    expect(db.course.update).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: { thumbnail: "https://s3/x.webp" },
    });
  });

  it("clears the thumbnail when null is sent", async () => {
    await updateCourse("u1", { courseId: "c1", thumbnail: null });

    expect(db.course.update).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: { thumbnail: null },
    });
  });

  it("refuses lesson mode while the course holds more than one draft lesson", async () => {
    db.lesson.count.mockResolvedValueOnce(2);

    await expect(
      updateCourse("u1", { courseId: "c1", mode: "LESSON" }),
    ).rejects.toMatchObject({
      applicationCode: "course.lesson_mode_needs_one_lesson",
    });
    expect(db.course.update).not.toHaveBeenCalled();
  });

  it("switches to lesson mode when a single draft lesson is left", async () => {
    await updateCourse("u1", { courseId: "c1", mode: "LESSON" });

    expect(db.course.update).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: { mode: "LESSON" },
    });
  });

  it("switches back to course mode without counting lessons", async () => {
    await updateCourse("u1", { courseId: "c1", mode: "COURSE" });

    expect(db.lesson.count).not.toHaveBeenCalled();
    expect(db.course.update).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: { mode: "COURSE" },
    });
  });
});
