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
const { getSceneContent } = await import("./scene-queries");

const USER = { id: "u1", name: "Ada", username: null };

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
