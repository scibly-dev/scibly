import { describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  course: { findUnique: vi.fn() },
  courseVersion: { findFirst: vi.fn() },
  scene: { findFirst: vi.fn() },
  lesson: { findMany: vi.fn() },
}));

vi.mock("@scibly/db", () => ({ db }));

const {
  requireAnonymousCourse,
  getLatestCourseVersion,
  getPublicSceneContent,
} = await import("./public-course");

function course(overrides: Partial<{ allowAnonymous: boolean }> = {}) {
  return {
    id: "c1",
    allowAnonymous: true,
    passingScorePct: 80,
    maxTries: 3,
    title: "Course",
    thumbnail: null,
    organization: null,
    ...overrides,
  };
}

describe("the anonymous boundary", () => {
  it("AB1: refuses a course that does not exist with NOT_FOUND", async () => {
    db.course.findUnique.mockResolvedValueOnce(null);

    await expect(requireAnonymousCourse("missing")).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Course not found.",
    });
  });

  it("AB2: refuses a real course with allowAnonymous: false with FORBIDDEN", async () => {
    db.course.findUnique.mockResolvedValueOnce(
      course({ allowAnonymous: false }),
    );

    await expect(requireAnonymousCourse("c1")).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "This course is not publicly accessible.",
    });
  });

  it("AB3: returns the course when allowAnonymous: true", async () => {
    db.course.findUnique.mockResolvedValueOnce(course());

    await expect(requireAnonymousCourse("c1")).resolves.toMatchObject({
      id: "c1",
    });
  });

  it("AB4: refuses a course with no non-superseded version with NOT_FOUND", async () => {
    db.courseVersion.findFirst.mockResolvedValueOnce(null);

    await expect(getLatestCourseVersion("c1")).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Course has not been published.",
    });
  });

  it("AB5: refuses a sceneId that does not belong to the given courseVersionId", async () => {
    db.course.findUnique.mockResolvedValueOnce(course());
    db.courseVersion.findFirst.mockResolvedValueOnce({
      id: "cv1",
      version: 1,
    });
    db.scene.findFirst.mockResolvedValueOnce(null);

    await expect(
      getPublicSceneContent("c1", "cv1", "scene-from-another-course"),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Scene content not found.",
    });

    expect(db.scene.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "scene-from-another-course",
          courseVersionId: "cv1",
          lesson: { courseId: "c1", courseVersionId: "cv1" },
        },
      }),
    );
  });
});
