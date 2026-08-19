import { beforeEach, describe, expect, it, vi } from "vitest";

// db.$transaction resolves without invoking its callback, so this only covers auth-before-write ordering.
const db = vi.hoisted(() => ({
  $transaction: vi.fn(),
}));

const requireDraftLesson = vi.hoisted(() => vi.fn());

vi.mock("@scibly/db", () => ({ db }));
vi.mock("./scene-access", () => ({ requireDraftLesson }));

const { reorderDraftScenes } = await import("./scene-ordering");

beforeEach(() => {
  vi.clearAllMocks();
  requireDraftLesson.mockResolvedValue({
    id: "l1",
    courseVersionId: null,
    courseId: "c1",
  });
  db.$transaction.mockResolvedValue(undefined);
});

describe("reorderDraftScenes", () => {
  it("W2: resolves the lesson via requireDraftLesson before rewriting order", async () => {
    await reorderDraftScenes("u1", { lessonId: "l1", sceneIds: ["s1", "s2"] });

    expect(requireDraftLesson).toHaveBeenCalledWith(db, "l1", "u1");
    expect(db.$transaction).toHaveBeenCalled();
  });

  it("W2: propagates FORBIDDEN from requireDraftLesson without opening a transaction", async () => {
    requireDraftLesson.mockRejectedValueOnce(
      Object.assign(new Error("forbidden"), { code: "FORBIDDEN" }),
    );

    await expect(
      reorderDraftScenes("u1", { lessonId: "l1", sceneIds: ["s1"] }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("JC2: the result names the course the reorder happened in", async () => {
    await expect(
      reorderDraftScenes("u1", { lessonId: "l1", sceneIds: ["s1"] }),
    ).resolves.toEqual({ success: true, lessonId: "l1", courseId: "c1" });
  });
});
