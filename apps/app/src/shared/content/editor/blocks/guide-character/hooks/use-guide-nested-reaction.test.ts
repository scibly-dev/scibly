import type {
  AnyInternalQuestionBlock,
  QuestionBlockMap,
} from "@/shared/content/editor/assessment/parsing/base-parser/types";

import { describe, expect, it } from "vitest";

import { EditableState } from "@/shared/content/editor/blocks/attributes/get-default-react-block-attributes";

import { deriveReactionFromGradedBlocks } from "./use-guide-nested-reaction";

// A zero-point question must not read as "correct" when scored 0/0.

function block(
  achievedPoints: number | undefined,
  maxPoints: number,
): AnyInternalQuestionBlock {
  return {
    blockId: "block-1",
    blockType: "custom-input-field",
    optional: false,
    solution: null,
    learnerAnswer: null,
    isAnswered: achievedPoints !== undefined,
    achievedPoints,
    maxPoints,
    blockSp: 10,
    userFriendlyName: "Question",
    questionNumber: 1,
    isEditable: EditableState.NotEditable,
    isResizable: false,
    isQuestionBlock: true,
    refs: 0,
  };
}

function questionBlocks(
  entries: Record<string, AnyInternalQuestionBlock>,
): QuestionBlockMap {
  return new Map(Object.entries(entries));
}

describe("a question worth zero points does not join the reaction", () => {
  it("the only graded block being worth zero yields no reaction, not perfect", () => {
    expect(
      deriveReactionFromGradedBlocks(["a"], questionBlocks({ a: block(0, 0) })),
    ).toBeNull();
  });

  it("a zero-value block sitting beside a correctly answered one does not spoil 'perfect'", () => {
    expect(
      deriveReactionFromGradedBlocks(
        ["a", "b"],
        questionBlocks({ a: block(0, 0), b: block(5, 5) }),
      ),
    ).toBe("perfect");
  });

  it("a zero-value block sitting beside an incorrectly answered one still reads as incorrect", () => {
    expect(
      deriveReactionFromGradedBlocks(
        ["a", "b"],
        questionBlocks({ a: block(0, 0), b: block(0, 5) }),
      ),
    ).toBe("incorrect");
  });
});

describe("a question worth something is graded normally, unaffected by the exclusion", () => {
  it("a fully correct answer reads as perfect", () => {
    expect(
      deriveReactionFromGradedBlocks(["a"], questionBlocks({ a: block(5, 5) })),
    ).toBe("perfect");
  });

  it("a fully incorrect answer reads as incorrect", () => {
    expect(
      deriveReactionFromGradedBlocks(["a"], questionBlocks({ a: block(0, 5) })),
    ).toBe("incorrect");
  });

  it("a partially correct answer reads as partial", () => {
    expect(
      deriveReactionFromGradedBlocks(["a"], questionBlocks({ a: block(2, 5) })),
    ).toBe("partial");
  });
});
