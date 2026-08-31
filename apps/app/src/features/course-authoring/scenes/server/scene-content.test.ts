import { beforeEach, describe, expect, it, vi } from "vitest";

// The collaborative writer is mocked; these tests cover only the routing —
// which failures are the caller's to fix, and what a refused write leaves behind.

const db = vi.hoisted(() => ({
  scene: { update: vi.fn() },
}));
const writeSceneHtml = vi.hoisted(() => vi.fn());
const requireDraftSceneContentAccess = vi.hoisted(() => vi.fn());

vi.mock("@scibly/db", () => ({ db, Prisma: { DbNull: "DbNull" } }));
vi.mock("../editor/document-synchronization/server/scene-document", () => ({
  writeSceneHtml,
}));
vi.mock("./scene-access", () => ({ requireDraftSceneContentAccess }));

const { updateDraftScene, writeSceneContent } = await import("./scene-content");

const USER = { id: "user_1", name: "Ada" };

beforeEach(() => {
  vi.clearAllMocks();
  requireDraftSceneContentAccess.mockResolvedValue({
    lessonId: "lesson_1",
    lesson: { courseId: "course_1" },
  });
  writeSceneHtml.mockResolvedValue({ success: true });
  db.scene.update.mockResolvedValue({ id: "scene_1", lessonId: "lesson_1" });
});

describe("writing scene content", () => {
  it("hands the content to the collaborative writer, as the author", async () => {
    await writeSceneContent(USER, {
      sceneId: "scene_1",
      html: "<p>Drafted.</p>",
      mode: "append",
    });

    expect(writeSceneHtml).toHaveBeenCalledWith({
      sceneId: "scene_1",
      html: "<p>Drafted.</p>",
      mode: "append",
      user: USER,
    });
  });

  it("replaces by default — a write that names no mode does not quietly append", async () => {
    await writeSceneContent(USER, { sceneId: "scene_1", html: "<p>New.</p>" });

    expect(writeSceneHtml).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "replace" }),
    );
  });

  it("content the editor would not accept comes back as the caller's mistake", async () => {
    writeSceneHtml.mockResolvedValue({
      success: false,
      error: "Unknown block type(s): quiz.",
      refused: true,
    });

    await expect(
      writeSceneContent(USER, { sceneId: "scene_1", html: "<div/>" }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Unknown block type(s): quiz.",
    });
  });

  it("a write that never reached the room is ours, not the caller's", async () => {
    writeSceneHtml.mockResolvedValue({
      success: false,
      error: "socket exploded",
      refused: false,
    });

    await expect(
      writeSceneContent(USER, { sceneId: "scene_1", html: "<p>x</p>" }),
    ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
  });
});

describe("updating a scene", () => {
  it("writes metadata and never content — that is writeSceneContent's job", async () => {
    await updateDraftScene(USER, {
      sceneId: "scene_1",
      updates: { title: "Intro" },
    });

    expect(writeSceneHtml).not.toHaveBeenCalled();
    expect(db.scene.update).toHaveBeenCalledWith({
      where: { id: "scene_1" },
      data: { title: "Intro", integration: undefined },
    });
  });

  it("clearing an integration writes a database null, not a missing field", async () => {
    await updateDraftScene(USER, {
      sceneId: "scene_1",
      updates: { integration: null },
    });

    expect(db.scene.update).toHaveBeenCalledWith({
      where: { id: "scene_1" },
      data: { integration: "DbNull" },
    });
  });
});
