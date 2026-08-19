import { AppError } from "@scibly/api/application-error";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Covers which organizations are consulted, in what order relative to what the caller is told, and what gets deleted.
const db = vi.hoisted(() => ({
  scene: {
    findMany: vi.fn(),
    deleteMany: vi.fn(),
    groupBy: vi.fn(),
  },
  lesson: {
    updateMany: vi.fn(),
  },
  $transaction: vi.fn(),
}));

const orgPolicy = vi.hoisted(() => ({ requireOrgMember: vi.fn() }));

vi.mock("@scibly/db", () => ({ db }));
vi.mock("@/features/organizations/server", () => orgPolicy);

const { deleteDraftScenes } = await import("./scene-mutations");

const ADMIN = "user-admin";
const ORG = "org-1";
const OTHER_ORG = "org-2";

type SceneRow = {
  id: string;
  lessonId: string;
  courseVersionId: string | null;
  lesson: {
    courseId: string;
    courseVersionId: string | null;
    course: { organizationId: string };
  };
};

function scene(id: string, overrides: Partial<SceneRow> = {}): SceneRow {
  return {
    id,
    lessonId: "lesson-1",
    courseVersionId: null,
    ...overrides,
    lesson: {
      courseId: "course-1",
      courseVersionId: null,
      course: { organizationId: ORG },
      ...overrides.lesson,
    },
  };
}

function lessonHoldsDraftScenes(counts: Record<string, number>) {
  db.scene.groupBy.mockResolvedValue(
    Object.entries(counts).map(([lessonId, count]) => ({
      lessonId,
      _count: { id: count },
    })),
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  db.scene.deleteMany.mockResolvedValue({ count: 0 });
  db.scene.findMany.mockResolvedValue([]);
  db.lesson.updateMany.mockResolvedValue({ count: 0 });
  db.$transaction.mockImplementation((fn) => fn(db));
  lessonHoldsDraftScenes({ "lesson-1": 5 });
});

describe("BD4/BD5 — authorization runs before anything is revealed", () => {
  it("BD4: requires admin_or_owner in the organization owning the scenes", async () => {
    db.scene.findMany.mockResolvedValueOnce([scene("scene-1")]);

    await deleteDraftScenes(ADMIN, ["scene-1"]);

    expect(orgPolicy.requireOrgMember).toHaveBeenCalledWith(
      ORG,
      ADMIN,
      "admin_or_owner",
    );
  });

  it("BD4: every organization in the batch is checked, not just the first", async () => {
    db.scene.findMany.mockResolvedValueOnce([
      scene("scene-1"),
      scene("scene-2", {
        lesson: {
          courseId: "course-2",
          courseVersionId: null,
          course: { organizationId: OTHER_ORG },
        },
      }),
    ]);

    await deleteDraftScenes(ADMIN, ["scene-1", "scene-2"]);

    expect(orgPolicy.requireOrgMember).toHaveBeenCalledWith(
      ORG,
      ADMIN,
      "admin_or_owner",
    );
    expect(orgPolicy.requireOrgMember).toHaveBeenCalledWith(
      OTHER_ORG,
      ADMIN,
      "admin_or_owner",
    );
  });

  it("BD4: an unauthorized caller does not learn that a scene id is missing", async () => {
    db.scene.findMany.mockResolvedValueOnce([scene("scene-1")]);
    orgPolicy.requireOrgMember.mockRejectedValue(
      new AppError({
        code: "FORBIDDEN",
        applicationCode: "org.forbidden",
        message: "Forbidden.",
      }),
    );

    await expect(
      deleteDraftScenes(ADMIN, ["scene-1", "scene-guessed"]),
    ).rejects.toThrow(AppError);
    expect(db.scene.deleteMany).not.toHaveBeenCalled();
  });

  it("BD4: an unauthorized caller does not learn that a scene is published", async () => {
    db.scene.findMany.mockResolvedValueOnce([
      scene("scene-1", { courseVersionId: "version-1" }),
    ]);
    orgPolicy.requireOrgMember.mockRejectedValue(
      new AppError({
        code: "FORBIDDEN",
        applicationCode: "org.forbidden",
        message: "Forbidden.",
      }),
    );

    await expect(deleteDraftScenes(ADMIN, ["scene-1"])).rejects.toThrow(
      AppError,
    );
  });

  it("BD5: a batch spanning an org the caller cannot administer deletes nothing", async () => {
    db.scene.findMany.mockResolvedValueOnce([
      scene("scene-1"),
      scene("scene-2", {
        lesson: {
          courseId: "course-2",
          courseVersionId: null,
          course: { organizationId: OTHER_ORG },
        },
      }),
    ]);
    orgPolicy.requireOrgMember.mockImplementation((organizationId: string) => {
      if (organizationId === OTHER_ORG) {
        throw new AppError({
          code: "FORBIDDEN",
          applicationCode: "org.forbidden",
          message: "Forbidden.",
        });
      }
      return Promise.resolve();
    });

    await expect(
      deleteDraftScenes(ADMIN, ["scene-1", "scene-2"]),
    ).rejects.toThrow(AppError);
    expect(db.scene.deleteMany).not.toHaveBeenCalled();
  });
});

describe("BD1 — a batch naming a scene that does not exist", () => {
  it("BD1: is refused whole, listing exactly the missing ids", async () => {
    db.scene.findMany.mockResolvedValueOnce([scene("scene-1")]);

    const result = await deleteDraftScenes(ADMIN, [
      "scene-1",
      "scene-gone",
      "scene-also-gone",
    ]);

    expect(result.success).toBe(false);
    expect(result.success ? [] : result.missingSceneIds).toEqual([
      "scene-gone",
      "scene-also-gone",
    ]);
    expect(db.scene.deleteMany).not.toHaveBeenCalled();
  });

  it("BD1: carries the code and the instruction the agent needs to recover", async () => {
    db.scene.findMany.mockResolvedValueOnce([]);

    const result = await deleteDraftScenes(ADMIN, ["scene-gone"]);

    expect(result.success ? "" : result.code).toBe("NOT_FOUND");
    expect(result.success ? "" : result.message).toContain("listScenes");
  });
});

describe("BD2 — a duplicated id", () => {
  it("BD2: is treated as one, and is not reported missing against itself", async () => {
    db.scene.findMany.mockResolvedValueOnce([scene("scene-1")]);

    const result = await deleteDraftScenes(ADMIN, ["scene-1", "scene-1"]);

    expect(result.success).toBe(true);
    expect(db.scene.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: ["scene-1"] } } }),
    );
  });

  it("BD2: does not count twice against the lesson's last remaining scene", async () => {
    db.scene.findMany.mockResolvedValueOnce([scene("scene-1")]);
    lessonHoldsDraftScenes({ "lesson-1": 2 });

    const result = await deleteDraftScenes(ADMIN, ["scene-1", "scene-1"]);

    expect(result.success).toBe(true);
  });
});

describe("BD3 — a published scene", () => {
  it("BD3: is refused whole, by its own version", async () => {
    db.scene.findMany.mockResolvedValueOnce([
      scene("scene-1"),
      scene("scene-2", { courseVersionId: "version-1" }),
    ]);

    const result = await deleteDraftScenes(ADMIN, ["scene-1", "scene-2"]);

    expect(result.success ? "" : result.code).toBe("PUBLISHED_SCENE");
    expect(db.scene.deleteMany).not.toHaveBeenCalled();
  });

  it("BD3: is refused whole when its lesson is the published one", async () => {
    db.scene.findMany.mockResolvedValueOnce([
      scene("scene-1", {
        lesson: {
          courseId: "course-1",
          courseVersionId: "version-1",
          course: { organizationId: ORG },
        },
      }),
    ]);

    const result = await deleteDraftScenes(ADMIN, ["scene-1"]);

    expect(result.success ? "" : result.code).toBe("PUBLISHED_SCENE");
    expect(result.success ? [] : result.publishedSceneIds).toEqual(["scene-1"]);
  });
});

describe("BD6 — a lesson's last remaining scene", () => {
  it("BD6: is refused, naming the lesson that would be emptied", async () => {
    db.scene.findMany.mockResolvedValueOnce([scene("scene-1")]);
    lessonHoldsDraftScenes({ "lesson-1": 1 });

    const result = await deleteDraftScenes(ADMIN, ["scene-1"]);

    expect(result.success ? "" : result.code).toBe("LAST_SCENE");
    expect(result.success ? "" : result.lessonId).toBe("lesson-1");
    expect(db.scene.deleteMany).not.toHaveBeenCalled();
  });

  it("BD6: is refused when the batch itself would empty the lesson", async () => {
    db.scene.findMany.mockResolvedValueOnce([
      scene("scene-1"),
      scene("scene-2"),
      scene("scene-3"),
    ]);
    lessonHoldsDraftScenes({ "lesson-1": 3 });

    const result = await deleteDraftScenes(ADMIN, [
      "scene-1",
      "scene-2",
      "scene-3",
    ]);

    expect(result.success ? "" : result.code).toBe("LAST_SCENE");
  });

  it("BD6: leaving one scene behind is allowed", async () => {
    db.scene.findMany.mockResolvedValueOnce([
      scene("scene-1"),
      scene("scene-2"),
    ]);
    lessonHoldsDraftScenes({ "lesson-1": 3 });

    const result = await deleteDraftScenes(ADMIN, ["scene-1", "scene-2"]);

    expect(result.success).toBe(true);
  });

  it("BD6: only draft scenes count towards what the lesson has left", async () => {
    db.scene.findMany.mockResolvedValueOnce([scene("scene-1")]);
    lessonHoldsDraftScenes({ "lesson-1": 2 });

    await deleteDraftScenes(ADMIN, ["scene-1"]);

    expect(db.scene.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ courseVersionId: null }),
      }),
    );
  });

  it("BD6: each lesson in a multi-lesson batch is judged on its own count", async () => {
    db.scene.findMany.mockResolvedValueOnce([
      scene("scene-1", { lessonId: "lesson-1" }),
      scene("scene-2", { lessonId: "lesson-2" }),
    ]);
    lessonHoldsDraftScenes({ "lesson-1": 5, "lesson-2": 1 });

    const result = await deleteDraftScenes(ADMIN, ["scene-1", "scene-2"]);

    expect(result.success ? "" : result.lessonId).toBe("lesson-2");
  });
});

describe("BD7/BD8 — what a successful delete does", () => {
  it("BD7: deletes exactly the requested scenes", async () => {
    db.scene.findMany.mockResolvedValueOnce([
      scene("scene-1"),
      scene("scene-2"),
    ]);

    await deleteDraftScenes(ADMIN, ["scene-1", "scene-2"]);

    expect(db.scene.deleteMany).toHaveBeenCalledWith({
      where: {
        id: { in: ["scene-1", "scene-2"] },
        courseVersionId: null,
      },
    });
  });

  it("BD7: refuses at the delete itself to touch a scene that became published", async () => {
    db.scene.findMany.mockResolvedValueOnce([scene("scene-1")]);

    await deleteDraftScenes(ADMIN, ["scene-1"]);

    const [call] = db.scene.deleteMany.mock.calls;
    expect(call?.[0]?.where?.courseVersionId).toBeNull();
  });

  it("BD7: reports each deleted scene with the lesson and course it came from", async () => {
    db.scene.findMany.mockResolvedValueOnce([scene("scene-1")]);

    const result = await deleteDraftScenes(ADMIN, ["scene-1"]);

    expect(result.success ? result.deleted : []).toEqual([
      { sceneId: "scene-1", lessonId: "lesson-1", courseId: "course-1" },
    ]);
  });

  it("BD8: bumps every lesson that lost a scene, so the next republish sees a change", async () => {
    db.scene.findMany.mockResolvedValueOnce([
      scene("scene-1", { lessonId: "lesson-1" }),
      scene("scene-2", { lessonId: "lesson-2" }),
      scene("scene-3", { lessonId: "lesson-1" }),
    ]);
    lessonHoldsDraftScenes({ "lesson-1": 5, "lesson-2": 5 });

    await deleteDraftScenes(ADMIN, ["scene-1", "scene-2", "scene-3"]);

    expect(db.lesson.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["lesson-1", "lesson-2"] } },
      data: {},
    });
  });

  it("BD8: is not bumped when the batch was refused", async () => {
    db.scene.findMany.mockResolvedValueOnce([scene("scene-1")]);
    lessonHoldsDraftScenes({ "lesson-1": 1 });

    await deleteDraftScenes(ADMIN, ["scene-1"]);

    expect(db.lesson.updateMany).not.toHaveBeenCalled();
  });
});
