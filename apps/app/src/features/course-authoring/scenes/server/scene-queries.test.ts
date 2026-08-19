import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  scene: { findMany: vi.fn() },
}));

const requireOrgMember = vi.hoisted(() => vi.fn());

vi.mock("@scibly/db", () => ({ db }));
vi.mock("@/features/organizations/server", () => ({ requireOrgMember }));

const { getDeletionNavigationContext } = await import("./scene-queries");

beforeEach(() => {
  vi.clearAllMocks();
  requireOrgMember.mockResolvedValue({ id: "m1", role: "admin" });
});

function makeScene(
  id: string,
  lessonId: string,
  organizationId = "orgA",
  courseId = "c1",
) {
  return {
    id,
    lesson: {
      id: lessonId,
      title: `Lesson ${lessonId}`,
      course: { id: courseId, title: `Course ${courseId}`, organizationId },
    },
  };
}

describe("getDeletionNavigationContext", () => {
  it("DNC1: authorizes against every distinct organization represented among the found scenes before returning any data", async () => {
    db.scene.findMany.mockResolvedValueOnce([
      makeScene("s1", "l1", "orgA"),
      makeScene("s2", "l2", "orgB"),
    ]);

    await getDeletionNavigationContext("u1", ["s1", "s2"]);

    expect(requireOrgMember).toHaveBeenCalledTimes(2);
    expect(requireOrgMember).toHaveBeenCalledWith(
      "orgA",
      "u1",
      "admin_or_owner",
    );
    expect(requireOrgMember).toHaveBeenCalledWith(
      "orgB",
      "u1",
      "admin_or_owner",
    );
  });

  it("DNC1: throws FORBIDDEN before returning any navigation data, when the caller lacks access to a second org in the batch", async () => {
    db.scene.findMany.mockResolvedValueOnce([
      makeScene("s1", "l1", "orgA"),
      makeScene("s2", "l2", "orgB"),
    ]);
    requireOrgMember
      .mockResolvedValueOnce({ id: "m1", role: "admin" })
      .mockRejectedValueOnce(
        Object.assign(new Error("forbidden"), { code: "FORBIDDEN" }),
      );

    await expect(
      getDeletionNavigationContext("u1", ["s1", "s2"]),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("DNC2: returns null without authorizing against any organization when no scene ids match", async () => {
    db.scene.findMany.mockResolvedValueOnce([]);

    await expect(
      getDeletionNavigationContext("u1", ["missing"]),
    ).resolves.toBeNull();
    expect(requireOrgMember).not.toHaveBeenCalled();
  });

  it("DNC3: returns the first scene's course, and focusLesson only when every found scene shares one lesson", async () => {
    db.scene.findMany.mockResolvedValueOnce([makeScene("s1", "l1", "orgA")]);

    await expect(getDeletionNavigationContext("u1", ["s1"])).resolves.toEqual({
      courseId: "c1",
      courseTitle: "Course c1",
      focusLesson: { id: "l1", title: "Lesson l1" },
    });
  });

  it("DNC3: omits focusLesson when the found scenes span more than one lesson", async () => {
    db.scene.findMany.mockResolvedValueOnce([
      makeScene("s1", "l1", "orgA"),
      makeScene("s2", "l2", "orgA"),
    ]);

    const result = await getDeletionNavigationContext("u1", ["s1", "s2"]);

    expect(result?.focusLesson).toBeUndefined();
  });

  it("DNC4: deduplicates repeated ids in the input before loading", async () => {
    db.scene.findMany.mockResolvedValueOnce([makeScene("s1", "l1", "orgA")]);

    await getDeletionNavigationContext("u1", ["s1", "s1"]);

    expect(db.scene.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: ["s1"] } } }),
    );
  });
});
