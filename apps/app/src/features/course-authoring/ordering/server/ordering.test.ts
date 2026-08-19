import { describe, expect, it, vi } from "vitest";

import {
  getNextDraftLessonOrder,
  getNextDraftSceneOrder,
  rewriteDraftLessonOrder,
  rewriteDraftSceneOrder,
} from "./ordering";

function makeTx() {
  return {
    lesson: { findFirst: vi.fn(), count: vi.fn(), update: vi.fn() },
    scene: { findFirst: vi.fn(), count: vi.fn(), update: vi.fn() },
  };
}

describe("getNextDraftLessonOrder", () => {
  it("LN1: returns 0 when the course has no draft lessons yet", async () => {
    const tx = makeTx();
    tx.lesson.findFirst.mockResolvedValue(null);

    await expect(getNextDraftLessonOrder(tx as never, "c1")).resolves.toBe(0);
    expect(tx.lesson.findFirst).toHaveBeenCalledWith({
      where: { courseId: "c1", courseVersionId: null },
      orderBy: { order: "desc" },
      select: { order: true },
    });
  });

  it("LN2: returns one past the highest existing draft lesson's order", async () => {
    const tx = makeTx();
    tx.lesson.findFirst.mockResolvedValue({ order: 4 });

    await expect(getNextDraftLessonOrder(tx as never, "c1")).resolves.toBe(5);
  });
});

describe("getNextDraftSceneOrder", () => {
  it("SN1: returns 0 when the lesson has no draft scenes yet", async () => {
    const tx = makeTx();
    tx.scene.findFirst.mockResolvedValue(null);

    await expect(getNextDraftSceneOrder(tx as never, "l1")).resolves.toBe(0);
    expect(tx.scene.findFirst).toHaveBeenCalledWith({
      where: { lessonId: "l1", courseVersionId: null },
      orderBy: { order: "desc" },
      select: { order: true },
    });
  });

  it("SN2: returns one past the highest existing draft scene's order", async () => {
    const tx = makeTx();
    tx.scene.findFirst.mockResolvedValue({ order: 2 });

    await expect(getNextDraftSceneOrder(tx as never, "l1")).resolves.toBe(3);
  });
});

describe("rewriteDraftLessonOrder", () => {
  it("RL1: writes each lesson's order to its index in the given list", async () => {
    const tx = makeTx();
    tx.lesson.count.mockResolvedValueOnce(2);
    tx.lesson.count.mockResolvedValueOnce(2);

    await rewriteDraftLessonOrder(tx as never, "c1", ["l2", "l1"]);

    expect(tx.lesson.update).toHaveBeenCalledWith({
      where: { id: "l2" },
      data: { order: 0 },
    });
    expect(tx.lesson.update).toHaveBeenCalledWith({
      where: { id: "l1" },
      data: { order: 1 },
    });
  });

  it("RL2: refuses a list with a duplicate lesson id, writing nothing", async () => {
    const tx = makeTx();
    tx.lesson.count.mockResolvedValue(2);

    await expect(
      rewriteDraftLessonOrder(tx as never, "c1", ["l1", "l1"]),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(tx.lesson.update).not.toHaveBeenCalled();
  });

  it.each([
    ["fewer ids than actual drafts", 3, ["l1", "l2"]],
    ["more ids than actual drafts", 1, ["l1", "l2"]],
  ])(
    "RL3: refuses when the list's length doesn't match (%s)",
    async (_label, draftCount, lessonIds) => {
      const tx = makeTx();
      tx.lesson.count.mockResolvedValueOnce(draftCount);
      tx.lesson.count.mockResolvedValueOnce(lessonIds.length);

      await expect(
        rewriteDraftLessonOrder(tx as never, "c1", lessonIds),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
      expect(tx.lesson.update).not.toHaveBeenCalled();
    },
  );

  it("RL4: refuses when the list includes an id that isn't a draft lesson owned by this course", async () => {
    const tx = makeTx();
    tx.lesson.count.mockResolvedValueOnce(2);
    tx.lesson.count.mockResolvedValueOnce(1);

    await expect(
      rewriteDraftLessonOrder(tx as never, "c1", [
        "l1",
        "published-or-foreign",
      ]),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(tx.lesson.update).not.toHaveBeenCalled();
  });
});

describe("rewriteDraftSceneOrder", () => {
  it("RS1: writes each scene's order to its index in the given list", async () => {
    const tx = makeTx();
    tx.scene.count.mockResolvedValueOnce(2);
    tx.scene.count.mockResolvedValueOnce(2);

    await rewriteDraftSceneOrder(tx as never, "l1", ["s2", "s1"]);

    expect(tx.scene.update).toHaveBeenCalledWith({
      where: { id: "s2" },
      data: { order: 0 },
    });
    expect(tx.scene.update).toHaveBeenCalledWith({
      where: { id: "s1" },
      data: { order: 1 },
    });
  });

  it("RS2: refuses a list with a duplicate scene id, writing nothing", async () => {
    const tx = makeTx();
    tx.scene.count.mockResolvedValue(2);

    await expect(
      rewriteDraftSceneOrder(tx as never, "l1", ["s1", "s1"]),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(tx.scene.update).not.toHaveBeenCalled();
  });

  it.each([
    ["fewer ids than actual drafts", 3, ["s1", "s2"]],
    ["more ids than actual drafts", 1, ["s1", "s2"]],
  ])(
    "RS3: refuses when the list's length doesn't match (%s)",
    async (_label, draftCount, sceneIds) => {
      const tx = makeTx();
      tx.scene.count.mockResolvedValueOnce(draftCount);
      tx.scene.count.mockResolvedValueOnce(sceneIds.length);

      await expect(
        rewriteDraftSceneOrder(tx as never, "l1", sceneIds),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
      expect(tx.scene.update).not.toHaveBeenCalled();
    },
  );

  it("RS4: refuses when the list includes an id that isn't a draft scene owned by this lesson", async () => {
    const tx = makeTx();
    tx.scene.count.mockResolvedValueOnce(2);
    tx.scene.count.mockResolvedValueOnce(1);

    await expect(
      rewriteDraftSceneOrder(tx as never, "l1", ["s1", "published-or-foreign"]),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(tx.scene.update).not.toHaveBeenCalled();
  });
});
