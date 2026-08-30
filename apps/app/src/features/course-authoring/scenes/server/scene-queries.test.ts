import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  scene: { findMany: vi.fn() },
}));

const requireOrgMember = vi.hoisted(() => vi.fn());
const requireSceneContentAccess = vi.hoisted(() => vi.fn());
const readSceneHtml = vi.hoisted(() => vi.fn());

vi.mock("@scibly/db", () => ({ db }));
vi.mock("@/features/organizations/server", () => ({ requireOrgMember }));
vi.mock("./scene-access", () => ({ requireSceneContentAccess }));
vi.mock("./scene-lineage", () => ({
  sceneLineageService: { getLineageForScene: async () => ["src_1"] },
}));
vi.mock("../editor/document-synchronization/server/scene-document", () => ({
  readSceneHtml,
}));

const { prosemirrorToYXmlFragment } = await import("@tiptap/y-tiptap");
const Y = await import("yjs");
const { parseSceneHtml } =
  await import("../editor/document-synchronization/server/scene-html");
const { getDeletionNavigationContext, getSceneContent } =
  await import("./scene-queries");

const USER = { id: "u1", name: "Ada", username: null };

/** The bytes the collab server flushes into `documentState`. */
function yjsBytes(html: string) {
  const document = new Y.Doc();
  prosemirrorToYXmlFragment(
    parseSceneHtml(html),
    document.getXmlFragment("default"),
  );
  return Y.encodeStateAsUpdate(document);
}

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

describe("getSceneContent", () => {
  it("SC1: reads a draft live from its collab document, never from the row", async () => {
    requireSceneContentAccess.mockResolvedValue({
      courseVersionId: null,
      documentState: yjsBytes("<p>Last flushed</p>"),
    });
    readSceneHtml.mockResolvedValue({
      success: true,
      html: "<p>Typed since</p>",
    });

    await expect(getSceneContent(USER, "s1")).resolves.toEqual({
      sceneId: "s1",
      html: "<p>Typed since</p>",
      sourceIds: ["src_1"],
    });
    expect(readSceneHtml).toHaveBeenCalledWith({
      sceneId: "s1",
      user: USER,
    });
  });

  it("SC2: refuses rather than falling back to the stale row when the room is unreachable", async () => {
    requireSceneContentAccess.mockResolvedValue({
      courseVersionId: null,
      documentState: yjsBytes("<p>Last flushed</p>"),
    });
    readSceneHtml.mockResolvedValue({ success: false, error: "sync timeout" });

    await expect(getSceneContent(USER, "s1")).rejects.toThrow("sync timeout");
  });

  it("SC3: reads a published scene from its frozen row, as readable HTML", async () => {
    requireSceneContentAccess.mockResolvedValue({
      courseVersionId: "v1",
      documentState: yjsBytes("<p>Published</p>"),
    });

    const result = await getSceneContent(USER, "s1");

    expect(result.html).toContain("Published");
    expect(result.html).not.toContain("Binary Yjs state");
    expect(readSceneHtml).not.toHaveBeenCalled();
  });

  it("SC4: reads a published scene saved before collaborative editing", async () => {
    requireSceneContentAccess.mockResolvedValue({
      courseVersionId: "v1",
      documentState: new TextEncoder().encode("<p>Written years ago</p>"),
    });

    await expect(getSceneContent(USER, "s1")).resolves.toHaveProperty(
      "html",
      "<p>Written years ago</p>",
    );
  });
});
