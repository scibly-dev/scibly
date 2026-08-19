import { describe, expect, it } from "vitest";

import { EditableState } from "@/shared/content/editor/blocks/attributes/get-default-react-block-attributes";

import { getQuestionBlockGradedState, gradedStateFromPoints } from "./helpers";

describe("a question worth zero points does not badge as correct", () => {
  it("gradedStateFromPoints reads an achieved/max of 0/0 as incorrect, not correct", () => {
    expect(gradedStateFromPoints(0, 0)).toBe("incorrect");
  });

  it("getQuestionBlockGradedState surfaces the same 0/0 pair as incorrect", () => {
    expect(
      getQuestionBlockGradedState(EditableState.NotEditable, false, 0, 0),
    ).toBeNull();
    expect(
      getQuestionBlockGradedState(EditableState.Default, false, 0, 0),
    ).toBe("incorrect");
  });
});

describe("a question worth something is graded normally, unaffected by the exclusion", () => {
  it.each([
    [5, 5, "correct"],
    [0, 5, "incorrect"],
    [2, 5, "partial"],
  ] as const)(
    "achieved %i of max %i reads as %s",
    (achieved, max, expected) => {
      expect(gradedStateFromPoints(achieved, max)).toBe(expected);
    },
  );
});
