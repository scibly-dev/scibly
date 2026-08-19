import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  scene: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    groupBy: vi.fn(),
    deleteMany: vi.fn(),
  },
  lesson: { updateMany: vi.fn() },
  $transaction: vi.fn(),
}));

const requireOrgMember = vi.hoisted(() => vi.fn());

vi.mock("@scibly/db", () => ({ db }));
vi.mock("@/features/organizations/server", () => ({ requireOrgMember }));

const { deleteDraftScenes, cloneDraftScene } =
  await import("./scene-mutations");

beforeEach(() => {
  vi.clearAllMocks();
  db.scene.deleteMany.mockResolvedValue({ count: 0 });
  db.scene.findMany.mockResolvedValue([]);
  db.lesson.updateMany.mockResolvedValue({ count: 0 });
  db.$transaction.mockImplementation((fn) => fn(db));
  requireOrgMember.mockResolvedValue({ id: "m1", role: "admin" });
});

function makeScene(
  id: string,
  lessonId: string,
  organizationId = "orgA",
  opts: {
    scenePublished?: boolean;
    lessonPublished?: boolean;
    courseId?: string;
  } = {},
) {
  return {
    id,
    lessonId,
    courseVersionId: opts.scenePublished ? "cv1" : null,
    lesson: {
      courseId: opts.courseId ?? "c1",
      courseVersionId: opts.lessonPublished ? "cv1" : null,
      course: { organizationId },
    },
  };
}

function groupByCounts(counts: Record<string, number>) {
  return Object.entries(counts).map(([lessonId, count]) => ({
    lessonId,
    _count: { id: count },
  }));
}

describe("deleteDraftScenes", () => {
  it("BD1: refuses a batch containing an id that doesn't exist, once the caller is authorized for the existing scenes' org", async () => {
    db.scene.findMany.mockResolvedValueOnce([makeScene("s1", "l1")]);

    await expect(
      deleteDraftScenes("u1", ["s1", "missing"]),
    ).resolves.toMatchObject({
      success: false,
      code: "NOT_FOUND",
      missingSceneIds: ["missing"],
    });
    expect(requireOrgMember).toHaveBeenCalledWith(
      "orgA",
      "u1",
      "admin_or_owner",
    );
  });

  it("BD1: returns NOT_FOUND without any authorization check when every id in the batch is unknown (residual leak, see spec Findings)", async () => {
    db.scene.findMany.mockResolvedValueOnce([]);

    await expect(deleteDraftScenes("u1", ["s1", "s2"])).resolves.toMatchObject({
      success: false,
      code: "NOT_FOUND",
      missingSceneIds: ["s1", "s2"],
    });
    expect(requireOrgMember).not.toHaveBeenCalled();
  });

  it("BD2: deduplicates repeated ids in the input before loading or deleting", async () => {
    db.scene.findMany.mockResolvedValueOnce([
      makeScene("s1", "l1"),
      makeScene("s2", "l2"),
    ]);
    db.scene.groupBy.mockResolvedValueOnce(groupByCounts({ l1: 2, l2: 2 }));

    const result = await deleteDraftScenes("u1", ["s1", "s1", "s2"]);

    expect(db.scene.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: ["s1", "s2"] } } }),
    );
    expect(result).toMatchObject({
      success: true,
      deleted: [
        { sceneId: "s1", lessonId: "l1", courseId: "c1" },
        { sceneId: "s2", lessonId: "l2", courseId: "c1" },
      ],
    });
  });

  it("BD3: refuses deleting a scene that is itself already published, once the caller is authorized", async () => {
    db.scene.findMany.mockResolvedValueOnce([
      makeScene("s1", "l1"),
      makeScene("s2", "l1", "orgA", { scenePublished: true }),
    ]);

    await expect(deleteDraftScenes("u1", ["s1", "s2"])).resolves.toMatchObject({
      success: false,
      code: "PUBLISHED_SCENE",
      publishedSceneIds: ["s2"],
    });
  });

  it("BD3: refuses deleting a scene whose lesson was published, even if the scene itself carries no courseVersionId", async () => {
    db.scene.findMany.mockResolvedValueOnce([
      makeScene("s1", "l1", "orgA", { lessonPublished: true }),
    ]);

    await expect(deleteDraftScenes("u1", ["s1"])).resolves.toMatchObject({
      success: false,
      code: "PUBLISHED_SCENE",
      publishedSceneIds: ["s1"],
    });
  });

  it("BD4: throws FORBIDDEN before revealing missing ids, when the caller isn't authorized for the existing scene's org", async () => {
    db.scene.findMany.mockResolvedValueOnce([makeScene("s1", "l1")]);
    requireOrgMember.mockRejectedValueOnce(
      Object.assign(new Error("forbidden"), { code: "FORBIDDEN" }),
    );

    await expect(
      deleteDraftScenes("u1", ["s1", "missing"]),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("BD4: throws FORBIDDEN before revealing publish status, when the caller isn't authorized for the existing scene's org", async () => {
    db.scene.findMany.mockResolvedValueOnce([
      makeScene("s1", "l1", "orgA", { scenePublished: true }),
    ]);
    requireOrgMember.mockRejectedValueOnce(
      Object.assign(new Error("forbidden"), { code: "FORBIDDEN" }),
    );

    await expect(deleteDraftScenes("u1", ["s1"])).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("BD4: authorizes each distinct organization represented in the batch exactly once", async () => {
    db.scene.findMany.mockResolvedValueOnce([
      makeScene("s1", "l1", "orgA"),
      makeScene("s2", "l1", "orgA"),
      makeScene("s3", "l2", "orgA"),
    ]);
    db.scene.groupBy.mockResolvedValueOnce(groupByCounts({ l1: 3, l2: 3 }));

    await deleteDraftScenes("u1", ["s1", "s2", "s3"]);

    expect(requireOrgMember).toHaveBeenCalledTimes(1);
    expect(requireOrgMember).toHaveBeenCalledWith(
      "orgA",
      "u1",
      "admin_or_owner",
    );
  });

  it("BD5: refuses the whole batch when the caller lacks access to even one of several represented organizations, deleting nothing", async () => {
    db.scene.findMany.mockResolvedValueOnce([
      makeScene("s1", "l1", "orgA"),
      makeScene("s2", "l2", "orgB"),
    ]);
    requireOrgMember
      .mockResolvedValueOnce({ id: "m1", role: "admin" })
      .mockRejectedValueOnce(
        Object.assign(new Error("forbidden"), { code: "FORBIDDEN" }),
      );

    await expect(deleteDraftScenes("u1", ["s1", "s2"])).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(db.scene.deleteMany).not.toHaveBeenCalled();
  });

  it("BD6: refuses deleting a lesson's last remaining draft scene", async () => {
    db.scene.findMany.mockResolvedValueOnce([makeScene("s1", "l1")]);
    db.scene.groupBy.mockResolvedValueOnce(groupByCounts({ l1: 1 }));

    await expect(deleteDraftScenes("u1", ["s1"])).resolves.toMatchObject({
      success: false,
      code: "LAST_SCENE",
      lessonId: "l1",
    });
    expect(db.scene.deleteMany).not.toHaveBeenCalled();
  });

  it("BD7: on success, deletes exactly the requested scenes and returns their scene/lesson/course ids", async () => {
    db.scene.findMany.mockResolvedValueOnce([
      makeScene("s1", "l1"),
      makeScene("s2", "l2"),
    ]);
    db.scene.groupBy.mockResolvedValueOnce(groupByCounts({ l1: 2, l2: 2 }));

    const result = await deleteDraftScenes("u1", ["s1", "s2"]);

    expect(db.scene.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["s1", "s2"] }, courseVersionId: null },
    });
    expect(result).toMatchObject({
      success: true,
      deleted: [
        { sceneId: "s1", lessonId: "l1", courseId: "c1" },
        { sceneId: "s2", lessonId: "l2", courseId: "c1" },
      ],
    });
  });

  it("BD8: on success, bumps updatedAt once per distinct lesson that lost a scene", async () => {
    db.scene.findMany.mockResolvedValueOnce([
      makeScene("s1", "l1"),
      makeScene("s2", "l1"),
    ]);
    db.scene.groupBy.mockResolvedValueOnce(groupByCounts({ l1: 3 }));

    await deleteDraftScenes("u1", ["s1", "s2"]);

    expect(db.lesson.updateMany).toHaveBeenCalledTimes(1);
    expect(db.lesson.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["l1"] } },
      data: {},
    });
  });
});

function makeCloneSource(
  opts: {
    scenePublished?: boolean;
    lessonPublished?: boolean;
    organizationId?: string;
  } = {},
) {
  return {
    id: "s1",
    lessonId: "l1",
    order: 0,
    title: "Scene",
    vibe: "NEUTRAL",
    animation: "FADE",
    sp: 10,
    isOutdated: false,
    integration: null,
    documentState: null,
    learnerContent: null,
    gradingManifest: null,
    courseVersionId: opts.scenePublished ? "cv1" : null,
    lesson: {
      courseVersionId: opts.lessonPublished ? "cv1" : null,
      course: { organizationId: opts.organizationId ?? "orgA" },
    },
  };
}

describe("cloneDraftScene", () => {
  it("CDS1: throws NOT_FOUND when the scene doesn't exist, without authorizing against any organization", async () => {
    db.scene.findUnique.mockResolvedValueOnce(null);

    await expect(cloneDraftScene("u1", "missing")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(requireOrgMember).not.toHaveBeenCalled();
  });

  it("CDS2: authorizes against the source scene's organization", async () => {
    db.scene.findUnique.mockResolvedValueOnce(makeCloneSource());
    db.$transaction.mockResolvedValueOnce(makeCloneSource());

    await cloneDraftScene("u1", "s1");

    expect(requireOrgMember).toHaveBeenCalledWith(
      "orgA",
      "u1",
      "admin_or_owner",
    );
  });

  it("CDS2: throws FORBIDDEN before revealing the scene's publish status, when the caller isn't authorized for its org", async () => {
    db.scene.findUnique.mockResolvedValueOnce(
      makeCloneSource({ scenePublished: true }),
    );
    requireOrgMember.mockRejectedValueOnce(
      Object.assign(new Error("forbidden"), { code: "FORBIDDEN" }),
    );

    await expect(cloneDraftScene("u1", "s1")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("CDS3: refuses cloning a scene that is itself already published, once authorized", async () => {
    db.scene.findUnique.mockResolvedValueOnce(
      makeCloneSource({ scenePublished: true }),
    );

    await expect(cloneDraftScene("u1", "s1")).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("CDS3: refuses cloning a scene whose lesson was published, even if the scene itself carries no courseVersionId", async () => {
    db.scene.findUnique.mockResolvedValueOnce(
      makeCloneSource({ lessonPublished: true }),
    );

    await expect(cloneDraftScene("u1", "s1")).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});
