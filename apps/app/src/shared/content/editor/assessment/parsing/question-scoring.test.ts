import type { QuestionData as ClozeData } from "@/shared/content/editor/blocks/questions/cloze-text/schema";
import type { QuestionData as DragData } from "@/shared/content/editor/blocks/questions/drag-and-drop/schema";
import type { QuestionData as FreeFormData } from "@/shared/content/editor/blocks/questions/free-form-input/schema";
import type { QuestionData as InputFieldData } from "@/shared/content/editor/blocks/questions/input-field/schema";
import type { QuestionData as MatchingData } from "@/shared/content/editor/blocks/questions/matching-pairs/schema";
import type { QuestionData as MultipleChoiceData } from "@/shared/content/editor/blocks/questions/multiple-choice/schema";

import { AppError } from "@scibly/api/application-error";
import { describe, expect, it } from "vitest";

import { gradeContentSubmissions } from "@/shared/content/editor/assessment/grading/grading";
import { CLOZE_TEXT_NODE_NAME } from "@/shared/content/editor/blocks/questions/cloze-text/schema";
import { DRAG_AND_DROP_NODE_NAME } from "@/shared/content/editor/blocks/questions/drag-and-drop/schema";
import { FREE_FORM_INPUT_NODE_NAME } from "@/shared/content/editor/blocks/questions/free-form-input/schema";
import { INPUT_FIELD_NODE_NAME } from "@/shared/content/editor/blocks/questions/input-field/schema";
import { MATCHING_PAIRS_NODE_NAME } from "@/shared/content/editor/blocks/questions/matching-pairs/schema";
import { MULTIPLE_CHOICE_NODE_NAME } from "@/shared/content/editor/blocks/questions/multiple-choice/schema";

import { questionBlockParserRegistry } from "./parser-registry";

const points = (blockType: string, questionData: unknown, answer: unknown) =>
  questionBlockParserRegistry.getPoints(
    blockType as never,
    questionData,
    answer,
  );

const maxPoints = (blockType: string, questionData: unknown) =>
  questionBlockParserRegistry.getMaxPoints(blockType as never, questionData);

const hasSolution = (blockType: string, questionData: unknown) =>
  questionBlockParserRegistry.hasSolution(blockType as never, questionData);

/**
 * One fixture per type, each with two markable parts so "half right" means the
 * same thing everywhere, plus a distractor wherever the type allows one.
 */

const CHOICES: MultipleChoiceData = {
  choices: [
    { id: "a", text: "Alpha" },
    { id: "b", text: "Beta" },
    { id: "c", text: "Gamma" },
  ],
  correctChoiceIds: ["a", "b"],
  allowMultiple: true,
};

const ONE_CHOICE: MultipleChoiceData = {
  ...CHOICES,
  correctChoiceIds: ["a"],
  allowMultiple: false,
};

const ONE_OF_TWO_RIGHT: MultipleChoiceData = {
  ...CHOICES,
  allowMultiple: false,
};

const ALL_CORRECT: MultipleChoiceData = {
  ...CHOICES,
  correctChoiceIds: ["a", "b", "c"],
};

const CLOZE: ClozeData = {
  segments: [
    { type: "text", id: "s1", content: "The " },
    { type: "gap", id: "g1", correctItemId: "w1" },
    { type: "text", id: "s2", content: " met the " },
    { type: "gap", id: "g2", correctItemId: "w2" },
  ],
  items: [
    { id: "w1", label: "cat" },
    { id: "w2", label: "dog" },
    { id: "w3", label: "fish" },
  ],
};

const DRAG: DragData = {
  items: [
    { id: "i1", label: "Apple" },
    { id: "i2", label: "Carrot" },
    { id: "i3", label: "Anvil" },
  ],
  zones: [
    { id: "z1", label: "Fruit" },
    { id: "z2", label: "Vegetable" },
  ],
  correctMappings: { i1: "z1", i2: "z2" },
};

const MATCHING: MatchingData = {
  pairs: [
    { pairId: "p1", leftItemId: "l1", rightItemId: "r1" },
    { pairId: "p2", leftItemId: "l2", rightItemId: "r2" },
  ],
  rightColumnOrder: ["r1", "r2"],
};

const INPUT: InputFieldData = {
  answer: "the cat sat down",
  caseSensitive: false,
};

const FREE_FORM: FreeFormData = { minLength: 10, maxLength: 200 };

describe("what a question is out of", () => {
  it.each([
    {
      id: "QS2",
      what: "multiple choice allowing one selection is worth one point",
      blockType: MULTIPLE_CHOICE_NODE_NAME,
      questionData: ONE_CHOICE,
      expected: 1,
    },
    {
      id: "QS2",
      what: "one selection is worth one point however many choices the author marked correct",
      blockType: MULTIPLE_CHOICE_NODE_NAME,
      questionData: ONE_OF_TWO_RIGHT,
      expected: 1,
    },
    {
      id: "QS2",
      what: "multiple choice allowing several is worth one point per correct choice",
      blockType: MULTIPLE_CHOICE_NODE_NAME,
      questionData: CHOICES,
      expected: 2,
    },
    {
      id: "QS2",
      what: "a question where every choice is correct is out of the number of choices",
      blockType: MULTIPLE_CHOICE_NODE_NAME,
      questionData: ALL_CORRECT,
      expected: 3,
    },
    {
      id: "QS3",
      what: "cloze text is worth one point per gap, and spare words change nothing",
      blockType: CLOZE_TEXT_NODE_NAME,
      questionData: CLOZE,
      expected: 2,
    },
    {
      id: "QS4",
      what: "drag and drop is worth one point per mapping, and unmapped items are distractors",
      blockType: DRAG_AND_DROP_NODE_NAME,
      questionData: DRAG,
      expected: 2,
    },
    {
      id: "QS5",
      what: "matching pairs is worth one point per pair",
      blockType: MATCHING_PAIRS_NODE_NAME,
      questionData: MATCHING,
      expected: 2,
    },
    {
      id: "QS6",
      what: "an input field is worth 0.25 per word of the answer",
      blockType: INPUT_FIELD_NODE_NAME,
      questionData: INPUT,
      expected: 1,
    },
    {
      id: "QS7",
      what: "a free-form question is worth one point",
      blockType: FREE_FORM_INPUT_NODE_NAME,
      questionData: FREE_FORM,
      expected: 1,
    },
  ])("$id: $what", ({ blockType, questionData, expected }) => {
    expect(maxPoints(blockType, questionData)).toBe(expected);
  });
});

describe("QS8: every part of a question is marked on its own", () => {
  it.each([
    {
      what: "one of two correct choices ticked",
      blockType: MULTIPLE_CHOICE_NODE_NAME,
      questionData: CHOICES,
      answer: ["a"],
    },
    {
      what: "one of two cloze gaps filled correctly",
      blockType: CLOZE_TEXT_NODE_NAME,
      questionData: CLOZE,
      answer: { g1: "w1" },
    },
    {
      what: "one of two items dropped in the right zone",
      blockType: DRAG_AND_DROP_NODE_NAME,
      questionData: DRAG,
      answer: { i1: "z1" },
    },
    {
      what: "one of two pairs matched",
      blockType: MATCHING_PAIRS_NODE_NAME,
      questionData: MATCHING,
      answer: { l1: "r1" },
    },
  ])(
    "half a question earns half its points — $what",
    ({ blockType, questionData, answer }) => {
      expect(points(blockType, questionData, answer)).toBe(1);
      expect(maxPoints(blockType, questionData)).toBe(2);
    },
  );

  it("two of four words in an input field earn half", () => {
    expect(points(INPUT_FIELD_NODE_NAME, INPUT, "the cat no no")).toBe(0.5);
  });
});

describe("QS9: a wrong tick cancels a right one", () => {
  it.each([
    { what: "both correct choices", answer: ["a", "b"], expected: 2 },
    { what: "one right, one wrong", answer: ["a", "c"], expected: 0 },
    { what: "every choice ticked", answer: ["a", "b", "c"], expected: 1 },
    { what: "only the wrong one", answer: ["c"], expected: 0 },
  ])("$what scores $expected", ({ answer, expected }) => {
    expect(points(MULTIPLE_CHOICE_NODE_NAME, CHOICES, answer)).toBe(expected);
  });

  it("ticking every choice is full marks only where every choice really is correct", () => {
    expect(
      points(MULTIPLE_CHOICE_NODE_NAME, ALL_CORRECT, ["a", "b", "c"]),
    ).toBe(3);
  });

  it.each([
    { what: "the correct choice alone", answer: ["a"], expected: 1 },
    { what: "the wrong choice", answer: ["b"], expected: 0 },
    {
      what: "the correct choice plus another",
      answer: ["a", "b"],
      expected: 0,
    },
  ])(
    "with one selection allowed, $what scores $expected",
    ({ answer, expected }) => {
      expect(points(MULTIPLE_CHOICE_NODE_NAME, ONE_CHOICE, answer)).toBe(
        expected,
      );
    },
  );
});

describe("QS10: a misplacement earns nothing and takes nothing away", () => {
  it.each([
    {
      what: "a cloze word in the wrong gap",
      blockType: CLOZE_TEXT_NODE_NAME,
      questionData: CLOZE,
      answer: { g1: "w1", g2: "w3" },
    },
    {
      what: "an item in the wrong zone",
      blockType: DRAG_AND_DROP_NODE_NAME,
      questionData: DRAG,
      answer: { i1: "z1", i2: "z1" },
    },
    {
      what: "a pair matched to the wrong partner",
      blockType: MATCHING_PAIRS_NODE_NAME,
      questionData: MATCHING,
      answer: { l1: "r1", l2: "r1" },
    },
  ])(
    "one right and one wrong still earns the one — $what",
    ({ blockType, questionData, answer }) => {
      expect(points(blockType, questionData, answer)).toBe(1);
    },
  );
});

describe("QS11: how an input field is matched", () => {
  it.each([
    { what: "the answer exactly", answer: "the cat sat down", expected: 1 },
    { what: "wrapped in spaces", answer: "  the cat sat down  ", expected: 1 },
    {
      what: "with repeated spacing between words",
      answer: "the  cat   sat down",
      expected: 1,
    },
    {
      what: "separated by a tab and a line break",
      answer: "the\tcat\nsat down",
      expected: 1,
    },
    {
      what: "in the wrong case, with case ignored",
      answer: "The Cat Sat Down",
      expected: 1,
    },
    {
      what: "the right words in the wrong order",
      answer: "cat the down sat",
      expected: 0,
    },
    { what: "the first word only", answer: "the", expected: 0.25 },
  ])("$what scores $expected", ({ answer, expected }) => {
    expect(points(INPUT_FIELD_NODE_NAME, INPUT, answer)).toBe(expected);
  });

  it("case counts when the author asked for it", () => {
    const caseSensitive: InputFieldData = { ...INPUT, caseSensitive: true };

    expect(
      points(INPUT_FIELD_NODE_NAME, caseSensitive, "The Cat Sat Down"),
    ).toBe(0);
    expect(
      points(INPUT_FIELD_NODE_NAME, caseSensitive, "the cat sat down"),
    ).toBe(1);
  });
});

describe("QS12: a free-form answer earns its point by being real", () => {
  it.each([
    {
      what: "an answer past the author's minimum",
      answer: "I think the answer is yes",
      expected: 1,
    },
    { what: "an answer shorter than the minimum", answer: "yes", expected: 0 },
    { what: "whitespace only", answer: "          ", expected: 0 },
  ])("$what scores $expected", ({ answer, expected }) => {
    expect(points(FREE_FORM_INPUT_NODE_NAME, FREE_FORM, answer)).toBe(expected);
  });
});

describe("QS16: a question never scores below zero", () => {
  it.each([
    {
      what: "every choice wrong",
      blockType: MULTIPLE_CHOICE_NODE_NAME,
      questionData: CHOICES,
      answer: ["c"],
    },
    {
      what: "every gap wrong",
      blockType: CLOZE_TEXT_NODE_NAME,
      questionData: CLOZE,
      answer: { g1: "w3", g2: "w3" },
    },
    {
      what: "every item misplaced",
      blockType: DRAG_AND_DROP_NODE_NAME,
      questionData: DRAG,
      answer: { i1: "z2", i2: "z1" },
    },
  ])("$what", ({ blockType, questionData, answer }) => {
    expect(points(blockType, questionData, answer)).toBe(0);
  });
});

describe("QS13: an answer naming a part the question does not have is refused", () => {
  it.each([
    {
      what: "a choice id that is not on the question",
      blockType: MULTIPLE_CHOICE_NODE_NAME,
      questionData: CHOICES,
      answer: ["a", "zz"],
    },
    {
      what: "a gap the cloze does not have",
      blockType: CLOZE_TEXT_NODE_NAME,
      questionData: CLOZE,
      answer: { g1: "w1", g9: "w2" },
    },
    {
      what: "an item that is not in the question",
      blockType: DRAG_AND_DROP_NODE_NAME,
      questionData: DRAG,
      answer: { i1: "z1", i9: "z2" },
    },
    {
      what: "a left item that has no row",
      blockType: MATCHING_PAIRS_NODE_NAME,
      questionData: MATCHING,
      answer: { l1: "r1", l9: "r2" },
    },
  ])("$what", ({ blockType, questionData, answer }) => {
    expect(() => points(blockType, questionData, answer)).toThrow();
  });
});

describe("QS14: an answer of the wrong shape is refused", () => {
  it.each([
    {
      what: "text where a set of placements was expected",
      blockType: DRAG_AND_DROP_NODE_NAME,
      questionData: DRAG,
      answer: "i1 goes in z1",
    },
    {
      what: "a number where gap placements were expected",
      blockType: CLOZE_TEXT_NODE_NAME,
      questionData: CLOZE,
      answer: 42,
    },
    {
      what: "text where a list of choices was expected",
      blockType: MULTIPLE_CHOICE_NODE_NAME,
      questionData: CHOICES,
      answer: "ab",
    },
  ])("$what", ({ blockType, questionData, answer }) => {
    expect(() => points(blockType, questionData, answer)).toThrow();
  });
});

describe("QS17: what a complete answer key is", () => {
  it.each([
    {
      what: "multiple choice with a correct choice",
      blockType: MULTIPLE_CHOICE_NODE_NAME,
      questionData: CHOICES,
      complete: true,
    },
    {
      what: "multiple choice with none marked correct",
      blockType: MULTIPLE_CHOICE_NODE_NAME,
      questionData: { ...CHOICES, correctChoiceIds: [] },
      complete: false,
    },
    {
      what: "a cloze whose gaps all have a word",
      blockType: CLOZE_TEXT_NODE_NAME,
      questionData: CLOZE,
      complete: true,
    },
    {
      what: "a cloze with a gap nobody filled in",
      blockType: CLOZE_TEXT_NODE_NAME,
      questionData: {
        ...CLOZE,
        segments: CLOZE.segments.map((segment) =>
          segment.id === "g2" ? { ...segment, correctItemId: "" } : segment,
        ),
      },
      complete: false,
    },
    {
      what: "drag and drop with at least one mapping",
      blockType: DRAG_AND_DROP_NODE_NAME,
      questionData: DRAG,
      complete: true,
    },
    {
      what: "drag and drop with nothing mapped",
      blockType: DRAG_AND_DROP_NODE_NAME,
      questionData: { ...DRAG, correctMappings: {} },
      complete: false,
    },
    {
      what: "matching pairs with every row complete",
      blockType: MATCHING_PAIRS_NODE_NAME,
      questionData: MATCHING,
      complete: true,
    },
    {
      what: "matching pairs with a half-built row",
      blockType: MATCHING_PAIRS_NODE_NAME,
      questionData: {
        ...MATCHING,
        pairs: [MATCHING.pairs[0]!, { ...MATCHING.pairs[1]!, rightItemId: "" }],
      },
      complete: false,
    },
    {
      what: "an input field with an answer",
      blockType: INPUT_FIELD_NODE_NAME,
      questionData: INPUT,
      complete: true,
    },
    {
      what: "an input field with an empty answer",
      blockType: INPUT_FIELD_NODE_NAME,
      questionData: { answer: "", caseSensitive: false },
      complete: false,
    },
    {
      what: "a free-form question, which needs no key",
      blockType: FREE_FORM_INPUT_NODE_NAME,
      questionData: FREE_FORM,
      complete: true,
    },
  ])("$what: $complete", ({ blockType, questionData, complete }) => {
    expect(hasSolution(blockType, questionData)).toBe(complete);
  });
});

describe("what marking refuses reaches the learner as a refused submission", () => {
  const grade = (questionData: unknown, learnerAnswer: unknown) =>
    gradeContentSubmissions(
      [{ blockId: "b1", blockType: CLOZE_TEXT_NODE_NAME, learnerAnswer }],
      [
        {
          blockId: "b1",
          blockType: CLOZE_TEXT_NODE_NAME,
          questionData,
          sp: 10,
        },
      ],
      25,
    );

  it("QS13: an answer naming a gap the question does not have", () => {
    expect(() => grade(CLOZE, { g1: "w1", g9: "w2" })).toThrow(AppError);
  });

  it("QS14: an answer of the wrong shape", () => {
    expect(() => grade(CLOZE, "g1 is w1")).toThrow(AppError);
  });

  it("QS18: a cloze with an unfillable gap is not marked out of what is left", () => {
    const broken = {
      ...CLOZE,
      segments: CLOZE.segments.map((segment) =>
        segment.id === "g2" ? { ...segment, correctItemId: "" } : segment,
      ),
    };

    expect(() => grade(broken, { g1: "w1", g2: "w2" })).toThrow(AppError);
  });

  it("a complete key still grades", () => {
    const { gradedBlocks } = grade(CLOZE, { g1: "w1", g2: "w2" });

    expect(gradedBlocks[0]?.achievedPoints).toBe(2);
    expect(gradedBlocks[0]?.spEarned).toBe(10);
  });
});
