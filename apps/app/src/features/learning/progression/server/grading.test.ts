import type { Prisma } from "@scibly/db";
import type { BlockSubmission, GradedBlock } from "@/shared/content/contracts";
import type { SceneGradingResult } from "./grading";

import { describe, expect, it } from "vitest";
import { z } from "zod";

import { INPUT_FIELD_NODE_NAME } from "@/shared/content/editor/blocks/questions/input-field/schema";
import { MULTIPLE_CHOICE_NODE_NAME } from "@/shared/content/editor/blocks/questions/multiple-choice/schema";

import { persistMemberSceneAnalytics } from "./grading";

// Tested directly against `persistMemberSceneAnalytics` (not complete-scene.ts,
// which doubles this module wholesale and can't observe the written row).

type UpsertArgs = Prisma.SceneAnalyticsUpsertArgs;

// Decoded because Prisma types a JSON column's written value as opaque; a
// malformed row then fails the assertion instead of silently reading empty.
const persistedRow = z.object({
  gradedBlocks: z.array(z.object({ blockType: z.string() })),
});

function capturedRow(details: {
  gradedBlocks: GradedBlock[];
  blocks?: BlockSubmission[];
}) {
  let captured: UpsertArgs | undefined;
  const tx = {
    sceneAnalytics: {
      upsert: (args: UpsertArgs) => {
        captured = args;
        return Promise.resolve(null);
      },
    },
  } as unknown as Prisma.TransactionClient;

  const result: SceneGradingResult = {
    sceneId: "s1",
    lessonId: "lesson-1",
    courseVersionId: "cv-1",
    spEarned: 10,
    gradedBlocks: details.gradedBlocks,
  };
  persistMemberSceneAnalytics(tx, "enr-1", {
    lessonId: "lesson-1",
    attempt: 1,
    result,
    blocks: details.blocks,
  });

  if (!captured) throw new Error("nothing was written");
  return persistedRow.parse(captured.create);
}

function graded(overrides: Partial<GradedBlock> = {}): GradedBlock {
  return {
    blockId: "b1",
    blockType: INPUT_FIELD_NODE_NAME,
    achievedPoints: 1,
    maxPoints: 1,
    spEarned: 10,
    ...overrides,
  };
}

describe("what an analytics row records", () => {
  it("SC24: the recorded question type is the one grading marked, not the one the submission claimed", () => {
    const row = capturedRow({
      gradedBlocks: [graded()],
      blocks: [
        {
          blockId: "b1",
          blockType: MULTIPLE_CHOICE_NODE_NAME,
          learnerAnswer: "the cat sat down",
        },
      ],
    });

    expect(row.gradedBlocks.map((block) => block.blockType)).toEqual([
      INPUT_FIELD_NODE_NAME,
    ]);
  });

  it("SC24: a question nobody answered is recorded as the type it was graded as", () => {
    const row = capturedRow({
      gradedBlocks: [graded({ achievedPoints: 0, spEarned: 0 })],
      blocks: [],
    });

    expect(row.gradedBlocks.map((block) => block.blockType)).toEqual([
      INPUT_FIELD_NODE_NAME,
    ]);
  });
});
