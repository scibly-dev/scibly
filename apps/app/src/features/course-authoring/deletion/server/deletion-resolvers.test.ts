import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  scene: { findMany: vi.fn() },
  lesson: { findMany: vi.fn() },
}));

const requireOrgMember = vi.hoisted(() => vi.fn());

vi.mock("@scibly/db", () => ({ db }));
vi.mock("@/features/organizations/server", () => ({ requireOrgMember }));

const { resolveLessonDeletion, resolveSceneDeletion } =
  await import("./deletion-resolvers");

beforeEach(() => {
  vi.clearAllMocks();
  requireOrgMember.mockResolvedValue({ id: "m1", role: "admin" });
});

function sceneRow(id: string, lessonId: string, courseId = "c1") {
  return {
    id,
    title: `Scene ${id}`,
    lesson: {
      id: lessonId,
      title: `Lesson ${lessonId}`,
      course: {
        id: courseId,
        title: `Course ${courseId}`,
        organizationId: `org-${courseId}`,
      },
    },
  };
}

function lessonRow(id: string, sceneCount: number, courseId = "c1") {
  return {
    id,
    title: `Lesson ${id}`,
    course: {
      id: courseId,
      title: `Course ${courseId}`,
      organizationId: `org-${courseId}`,
    },
    _count: { scenes: sceneCount },
  };
}

describe("resolveSceneDeletion", () => {
  it("R1: names what would be deleted only after admin access to the course's org is proven", async () => {
    db.scene.findMany.mockResolvedValueOnce([sceneRow("s1", "l1")]);

    await expect(resolveSceneDeletion("u1", ["s1"])).resolves.toEqual({
      course: { id: "c1", title: "Course c1" },
      found: [
        {
          sceneId: "s1",
          sceneTitle: "Scene s1",
          lessonId: "l1",
          lessonTitle: "Lesson l1",
        },
      ],
      missing: [],
    });
    expect(requireOrgMember).toHaveBeenCalledWith(
      "org-c1",
      "u1",
      "admin_or_owner",
    );
  });

  it("R2: an editor who cannot administer the course learns nothing about it", async () => {
    db.scene.findMany.mockResolvedValueOnce([sceneRow("s1", "l1")]);
    requireOrgMember.mockRejectedValueOnce(
      Object.assign(new Error("forbidden"), { code: "FORBIDDEN" }),
    );

    await expect(resolveSceneDeletion("u1", ["s1"])).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("R3: ids matching no draft scene authorize against nothing, because there is nothing to authorize against", async () => {
    db.scene.findMany.mockResolvedValueOnce([]);

    await expect(resolveSceneDeletion("u1", ["nope"])).resolves.toBeNull();
    expect(requireOrgMember).not.toHaveBeenCalled();
  });

  it("R4: an id from a second course is reported missing, never listed under this course's title", async () => {
    db.scene.findMany.mockResolvedValueOnce([
      sceneRow("s1", "l1", "c1"),
      sceneRow("s2", "l2", "c2"),
    ]);

    const result = await resolveSceneDeletion("u1", ["s1", "s2"]);

    expect(result).toMatchObject({
      course: { id: "c1" },
      missing: ["s2"],
    });
    expect(result?.found.map((scene) => scene.sceneId)).toEqual(["s1"]);
    expect(requireOrgMember).toHaveBeenCalledTimes(1);
  });

  it("R5: only draft scenes of draft lessons are candidates, and a repeated id is asked for once", async () => {
    db.scene.findMany.mockResolvedValueOnce([sceneRow("s1", "l1")]);

    await resolveSceneDeletion("u1", ["s1", "s1"]);

    expect(db.scene.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: { in: ["s1"] },
          courseVersionId: null,
          lesson: { courseVersionId: null },
        },
      }),
    );
  });
});

describe("resolveLessonDeletion", () => {
  it("R6: a lesson that has lost its last scene still resolves, and still names itself", async () => {
    db.lesson.findMany.mockResolvedValueOnce([lessonRow("l1", 0)]);

    await expect(resolveLessonDeletion("u1", ["l1"])).resolves.toEqual({
      course: { id: "c1", title: "Course c1" },
      found: [{ lessonId: "l1", lessonTitle: "Lesson l1", sceneCount: 0 }],
      missing: [],
    });
  });

  it("R7: the scene count is the drafts that would go with the lesson", async () => {
    db.lesson.findMany.mockResolvedValueOnce([lessonRow("l1", 3)]);

    const result = await resolveLessonDeletion("u1", ["l1"]);

    expect(result?.found[0]?.sceneCount).toBe(3);
    expect(db.lesson.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          _count: { select: { scenes: { where: { courseVersionId: null } } } },
        }),
      }),
    );
  });

  it("R8: an id that is not a draft lesson of this course comes back missing", async () => {
    db.lesson.findMany.mockResolvedValueOnce([
      lessonRow("l1", 1),
      lessonRow("l9", 1, "c2"),
    ]);

    await expect(
      resolveLessonDeletion("u1", ["l1", "l9", "gone"]),
    ).resolves.toMatchObject({ course: { id: "c1" }, missing: ["l9", "gone"] });
  });

  it("R9: lessons that match nothing resolve to nothing", async () => {
    db.lesson.findMany.mockResolvedValueOnce([]);

    await expect(resolveLessonDeletion("u1", ["l1"])).resolves.toBeNull();
    expect(requireOrgMember).not.toHaveBeenCalled();
  });
});
