import type { DbProgress } from "./types";

import { describe, expect, it } from "vitest";

import { derivePendingSubmissions } from "./calculations";

// Adds answer-key-specific coverage beyond navigation-session.test.ts's NS7.

function dbProgress(overrides: Partial<DbProgress> = {}): DbProgress {
  return {
    completedLessonIds: [],
    completedSceneIds: [],
    totalSP: 0,
    sceneAnalytics: [],
    hasPassed: false,
    triesCount: 0,
    status: "NOT_STARTED",
    ...overrides,
  };
}

const WRONG_ANSWER_BLOCK = {
  blockId: "b1",
  blockType: "multiple-choice",
  learnerAnswer: "wrong",
  achievedPoints: 0,
  maxPoints: 5,
  spEarned: 0,
  correctAnswer: "right",
};

describe("review path", () => {
  it("RP1: attaches the answer key for a completed scene even when the block was answered incorrectly", () => {
    const submissions = derivePendingSubmissions(
      dbProgress({
        completedSceneIds: ["sc1"],
        sceneAnalytics: [
          { sceneId: "sc1", spEarned: 0, gradedBlocks: [WRONG_ANSWER_BLOCK] },
        ],
      }),
    );

    expect(submissions.sc1?.gradedBlocks).toEqual([
      {
        blockId: "b1",
        achievedPoints: 0,
        maxPoints: 5,
        spEarned: 0,
        correctAnswer: "right",
      },
    ]);
  });

  it("RP2: never attaches the answer key for a scene not yet in completedSceneIds, even when a sceneAnalytics row already exists for it", () => {
    const submissions = derivePendingSubmissions(
      dbProgress({
        completedSceneIds: [],
        sceneAnalytics: [
          { sceneId: "sc1", spEarned: 0, gradedBlocks: [WRONG_ANSWER_BLOCK] },
        ],
      }),
    );

    expect(submissions.sc1?.gradedBlocks).toBeUndefined();
  });

  it("RP3: always attaches the learner's raw answer, and never the answer key, regardless of completion", () => {
    const notCompleted = derivePendingSubmissions(
      dbProgress({
        completedSceneIds: [],
        sceneAnalytics: [
          { sceneId: "sc1", spEarned: 0, gradedBlocks: [WRONG_ANSWER_BLOCK] },
        ],
      }),
    );
    const completed = derivePendingSubmissions(
      dbProgress({
        completedSceneIds: ["sc1"],
        sceneAnalytics: [
          { sceneId: "sc1", spEarned: 0, gradedBlocks: [WRONG_ANSWER_BLOCK] },
        ],
      }),
    );

    const expectedBlocks = [
      { blockId: "b1", blockType: "multiple-choice", learnerAnswer: "wrong" },
    ];
    expect(notCompleted.sc1?.blocks).toEqual(expectedBlocks);
    expect(completed.sc1?.blocks).toEqual(expectedBlocks);
  });
});
