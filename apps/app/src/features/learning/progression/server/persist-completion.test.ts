import type { SceneGradingResult } from "./grading";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { INPUT_FIELD_NODE_NAME } from "@/shared/content/editor/blocks/questions/input-field/schema";

/**
 * Exercises `persistMemberSceneCompletion` against a capturing fake transaction
 * client, with `persistMemberSceneAnalytics` doubled (owned by its own seam).
 */

const persistMemberSceneAnalytics = vi.hoisted(() => vi.fn());
vi.mock("./grading", () => ({ persistMemberSceneAnalytics }));

const { persistMemberSceneCompletion } = await import("./persist-completion");

function makeTx() {
  return { sceneProgress: { upsert: vi.fn() } };
}

function buildResult(
  overrides: Partial<SceneGradingResult> = {},
): SceneGradingResult {
  return {
    sceneId: "s1",
    lessonId: "lesson-1",
    courseVersionId: "cv-1",
    spEarned: 10,
    gradedBlocks: [
      {
        blockId: "b1",
        blockType: INPUT_FIELD_NODE_NAME,
        achievedPoints: 1,
        maxPoints: 1,
        spEarned: 10,
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("persistMemberSceneCompletion", () => {
  it("SC25: upserts scene progress keyed by enrollment, lesson, scene and the graded attempt", async () => {
    const tx = makeTx();

    await persistMemberSceneCompletion(tx as never, "enr-1", {
      lessonId: "lesson-1",
      attempt: 3,
      result: buildResult(),
    });

    expect(tx.sceneProgress.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          enrollmentId_lessonId_sceneId_attempt: {
            enrollmentId: "enr-1",
            lessonId: "lesson-1",
            sceneId: "s1",
            attempt: 3,
          },
        },
      }),
    );
  });

  it("SC26: create writes the graded status and SP", async () => {
    const tx = makeTx();

    await persistMemberSceneCompletion(tx as never, "enr-1", {
      lessonId: "lesson-1",
      attempt: 1,
      result: buildResult({ spEarned: 25 }),
    });

    const call = tx.sceneProgress.upsert.mock.calls[0]![0];
    expect(call.create).toMatchObject({
      enrollmentId: "enr-1",
      lessonId: "lesson-1",
      sceneId: "s1",
      attempt: 1,
      status: "COMPLETED",
      spEarned: 25,
    });
    expect(call.create.completedAt).toBeInstanceOf(Date);
  });

  it("SC26: update writes the same graded status and SP as create", async () => {
    const tx = makeTx();

    await persistMemberSceneCompletion(tx as never, "enr-1", {
      lessonId: "lesson-1",
      attempt: 1,
      result: buildResult({ spEarned: 25 }),
    });

    const call = tx.sceneProgress.upsert.mock.calls[0]![0];
    expect(call.update).toEqual({
      status: "COMPLETED",
      completedAt: call.create.completedAt,
      spEarned: 25,
    });
  });

  it("persists analytics before writing progress, against the same transaction and details", async () => {
    const tx = makeTx();
    const details = {
      lessonId: "lesson-1",
      attempt: 1,
      result: buildResult(),
    };

    await persistMemberSceneCompletion(tx as never, "enr-1", details);

    expect(persistMemberSceneAnalytics).toHaveBeenCalledWith(
      tx,
      "enr-1",
      details,
    );
  });
});
