import type { QuestionData as ClozeData } from "@/shared/content/editor/blocks/questions/cloze-text/schema";
import type { QuestionData as DragData } from "@/shared/content/editor/blocks/questions/drag-and-drop/schema";
import type { QuestionData as FreeFormData } from "@/shared/content/editor/blocks/questions/free-form-input/schema";
import type { QuestionData as InputFieldData } from "@/shared/content/editor/blocks/questions/input-field/schema";
import type { QuestionData as MatchingData } from "@/shared/content/editor/blocks/questions/matching-pairs/schema";
import type { QuestionData as MultipleChoiceData } from "@/shared/content/editor/blocks/questions/multiple-choice/schema";
import type { QuestionBlocksType } from "@/shared/content/editor/blocks/registry/shared";
import type { QuestionData as StepsData } from "@/shared/content/editor/blocks/steps/schema";

import { describe, expect, it } from "vitest";

import { questionBlockParserRegistry } from "@/shared/content/editor/assessment/parsing/parser-registry";
import { CLOZE_TEXT_NODE_NAME } from "@/shared/content/editor/blocks/questions/cloze-text/schema";
import { DRAG_AND_DROP_NODE_NAME } from "@/shared/content/editor/blocks/questions/drag-and-drop/schema";
import { FREE_FORM_INPUT_NODE_NAME } from "@/shared/content/editor/blocks/questions/free-form-input/schema";
import { INPUT_FIELD_NODE_NAME } from "@/shared/content/editor/blocks/questions/input-field/schema";
import { MATCHING_PAIRS_NODE_NAME } from "@/shared/content/editor/blocks/questions/matching-pairs/schema";
import { MULTIPLE_CHOICE_NODE_NAME } from "@/shared/content/editor/blocks/questions/multiple-choice/schema";
import { STEPS_NODE_NAME } from "@/shared/content/editor/blocks/steps/schema";

// A finishable question of each type, so every unfinishable fixture below is
// one edit away from valid and the tests say which edit mattered.

const CHOICES: MultipleChoiceData = {
  choices: [
    { id: "a", text: "Cat" },
    { id: "b", text: "Dog" },
    { id: "c", text: "Fish" },
  ],
  correctChoiceIds: ["a"],
  allowMultiple: false,
};

const CLOZE: ClozeData = {
  segments: [
    { type: "text", id: "s1", content: "The " },
    { type: "gap", id: "g1", correctItemId: "w1" },
    { type: "text", id: "s2", content: " chased the " },
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

const STEPS: StepsData = { stepCount: 3, firstEmptyStep: null };

describe("SOL1: a question is finishable when it has the answer key its type requires", () => {
  it.each<[string, QuestionBlocksType, unknown]>([
    ["multiple choice, one correct option", MULTIPLE_CHOICE_NODE_NAME, CHOICES],
    [
      "multiple choice, several correct options",
      MULTIPLE_CHOICE_NODE_NAME,
      { ...CHOICES, correctChoiceIds: ["a", "b"], allowMultiple: true },
    ],
    ["cloze, every gap has a word", CLOZE_TEXT_NODE_NAME, CLOZE],
    ["drag and drop, every item has a zone", DRAG_AND_DROP_NODE_NAME, DRAG],
    [
      "matching pairs, every row is complete",
      MATCHING_PAIRS_NODE_NAME,
      MATCHING,
    ],
    ["input field, an answer is written", INPUT_FIELD_NODE_NAME, INPUT],
    ["steps, every step has something in it", STEPS_NODE_NAME, STEPS],
  ])("%s: nothing is missing", (_case, blockType, questionData) => {
    expect(
      questionBlockParserRegistry.describeMissingSolution(
        blockType,
        questionData,
      ),
    ).toBeNull();
  });

  it("free-form writing is always finishable — a human marks it, so there is no key to miss", () => {
    expect(
      questionBlockParserRegistry.describeMissingSolution(
        FREE_FORM_INPUT_NODE_NAME,
        FREE_FORM,
      ),
    ).toBeNull();
  });
});

describe("SOL1: a question missing its answer key cannot be finished", () => {
  it.each<[string, QuestionBlocksType, unknown]>([
    [
      "multiple choice with no option marked correct",
      MULTIPLE_CHOICE_NODE_NAME,
      { ...CHOICES, correctChoiceIds: [] },
    ],
    [
      "a cloze gap left without a word",
      CLOZE_TEXT_NODE_NAME,
      {
        ...CLOZE,
        segments: CLOZE.segments.map((segment) =>
          segment.id === "g2" ? { ...segment, correctItemId: "" } : segment,
        ),
      },
    ],
    [
      "cloze prose with no gaps at all — nothing for a learner to do",
      CLOZE_TEXT_NODE_NAME,
      {
        ...CLOZE,
        segments: [{ type: "text" as const, id: "s1", content: "Just prose" }],
      },
    ],
    [
      "drag and drop where no item has a zone",
      DRAG_AND_DROP_NODE_NAME,
      { ...DRAG, correctMappings: {} },
    ],
    [
      "a matching row with no partner",
      MATCHING_PAIRS_NODE_NAME,
      {
        ...MATCHING,
        pairs: [
          MATCHING.pairs[0]!,
          { pairId: "p2", leftItemId: "l2", rightItemId: "" },
        ],
      },
    ],
    [
      "matching pairs with no rows at all",
      MATCHING_PAIRS_NODE_NAME,
      { ...MATCHING, pairs: [], rightColumnOrder: [] },
    ],
    [
      "an input field whose answer was never written",
      INPUT_FIELD_NODE_NAME,
      { ...INPUT, answer: "" },
    ],
    [
      "an input field holding only whitespace",
      INPUT_FIELD_NODE_NAME,
      { ...INPUT, answer: "   " },
    ],
    [
      "a step the learner would open onto nothing",
      STEPS_NODE_NAME,
      { ...STEPS, firstEmptyStep: 2 },
    ],
    [
      "a steps block with no steps at all",
      STEPS_NODE_NAME,
      { ...STEPS, stepCount: 0 },
    ],
  ])("%s", (_case, blockType, questionData) => {
    expect(
      questionBlockParserRegistry.describeMissingSolution(
        blockType,
        questionData,
      ),
    ).not.toBeNull();
  });
});

describe("SOL1b: a key pointing at a part the author has since deleted is not a key", () => {
  it.each<[string, QuestionBlocksType, unknown]>([
    [
      "the correct choice was deleted from the options",
      MULTIPLE_CHOICE_NODE_NAME,
      {
        ...CHOICES,
        choices: CHOICES.choices.filter((choice) => choice.id !== "a"),
      },
    ],
    [
      "a gap's word was removed from the word bank",
      CLOZE_TEXT_NODE_NAME,
      { ...CLOZE, items: CLOZE.items.filter((item) => item.id !== "w2") },
    ],
    [
      "an item is mapped onto a zone that no longer exists",
      DRAG_AND_DROP_NODE_NAME,
      { ...DRAG, zones: DRAG.zones.filter((zone) => zone.id !== "z2") },
    ],
  ])("%s", (_case, blockType, questionData) => {
    expect(
      questionBlockParserRegistry.describeMissingSolution(
        blockType,
        questionData,
      ),
    ).not.toBeNull();
  });
});

describe("SOL3: the reason names the part the author has to go and fix", () => {
  it("a cloze gap is named by its position among the gaps, not by its id", () => {
    const reason = questionBlockParserRegistry.describeMissingSolution(
      CLOZE_TEXT_NODE_NAME,
      {
        ...CLOZE,
        segments: CLOZE.segments.map((segment) =>
          segment.id === "g2" ? { ...segment, correctItemId: "" } : segment,
        ),
      },
    );

    expect(reason).toMatch(/\b2\b/);
    expect(reason).not.toContain("g2");
    expect(reason).not.toContain("correctItemId");
  });

  it("a matching row is named by its position, not by its pair id", () => {
    const reason = questionBlockParserRegistry.describeMissingSolution(
      MATCHING_PAIRS_NODE_NAME,
      {
        ...MATCHING,
        pairs: [
          MATCHING.pairs[0]!,
          { pairId: "p2", leftItemId: "l2", rightItemId: "" },
        ],
      },
    );

    expect(reason).toMatch(/\b2\b/);
    expect(reason).not.toContain("p2");
    expect(reason).not.toContain("rightItemId");
  });

  it("multiple choice says what is missing without naming a field", () => {
    const reason = questionBlockParserRegistry.describeMissingSolution(
      MULTIPLE_CHOICE_NODE_NAME,
      { ...CHOICES, correctChoiceIds: [] },
    );

    expect(reason).not.toContain("correctChoiceIds");
    expect(reason?.length).toBeGreaterThan(0);
  });
});

describe("SOL3b: several missing parts report the first one the author would reach", () => {
  it("a cloze with gaps 1 and 3 empty names gap 1", () => {
    const reason = questionBlockParserRegistry.describeMissingSolution(
      CLOZE_TEXT_NODE_NAME,
      {
        items: CLOZE.items,
        segments: [
          { type: "gap", id: "g1", correctItemId: "" },
          { type: "text", id: "s1", content: " and " },
          { type: "gap", id: "g2", correctItemId: "w2" },
          { type: "text", id: "s2", content: " and " },
          { type: "gap", id: "g3", correctItemId: "" },
        ],
      },
    );

    expect(reason).toMatch(/\b1\b/);
    expect(reason).not.toMatch(/\b3\b/);
  });
});

describe("SOL4: what a question is worth has no bearing on whether it can be finished", () => {
  it("a cloze with one gap and no word is unfinishable, though it is worth a point", () => {
    const questionData: ClozeData = {
      segments: [{ type: "gap", id: "g1", correctItemId: "" }],
      items: [{ id: "w1", label: "cat" }],
    };

    expect(
      questionBlockParserRegistry.getMaxPoints(
        CLOZE_TEXT_NODE_NAME,
        questionData,
      ),
    ).toBe(1);
    expect(
      questionBlockParserRegistry.describeMissingSolution(
        CLOZE_TEXT_NODE_NAME,
        questionData,
      ),
    ).not.toBeNull();
  });

  it("a question worth nothing at all buys no exemption", () => {
    const questionData: InputFieldData = { ...INPUT, answer: "" };

    expect(
      questionBlockParserRegistry.getMaxPoints(
        INPUT_FIELD_NODE_NAME,
        questionData,
      ),
    ).toBe(0);
    expect(
      questionBlockParserRegistry.describeMissingSolution(
        INPUT_FIELD_NODE_NAME,
        questionData,
      ),
    ).not.toBeNull();
  });
});

describe("SOL5: a part the learner chooses between is not a part the author left blank", () => {
  it("a draggable item with no correct zone is a distractor, not a gap in the key", () => {
    expect(
      questionBlockParserRegistry.describeMissingSolution(
        DRAG_AND_DROP_NODE_NAME,
        {
          ...DRAG,
          items: [...DRAG.items, { id: "i3", label: "Brick" }],
        },
      ),
    ).toBeNull();
  });
});

describe("SOL2: the boolean and the reason are one rule, so they cannot disagree", () => {
  it.each<[string, QuestionBlocksType, unknown, unknown]>([
    [
      "multiple choice",
      MULTIPLE_CHOICE_NODE_NAME,
      CHOICES,
      { ...CHOICES, correctChoiceIds: [] },
    ],
    [
      "cloze text",
      CLOZE_TEXT_NODE_NAME,
      CLOZE,
      {
        ...CLOZE,
        segments: [{ type: "text" as const, id: "s1", content: "prose" }],
      },
    ],
    [
      "drag and drop",
      DRAG_AND_DROP_NODE_NAME,
      DRAG,
      { ...DRAG, correctMappings: {} },
    ],
    [
      "matching pairs",
      MATCHING_PAIRS_NODE_NAME,
      MATCHING,
      { ...MATCHING, pairs: [] },
    ],
    ["input field", INPUT_FIELD_NODE_NAME, INPUT, { ...INPUT, answer: "" }],
    ["steps", STEPS_NODE_NAME, STEPS, { ...STEPS, firstEmptyStep: 1 }],
  ])("%s agrees with itself", (_case, blockType, complete, incomplete) => {
    expect(questionBlockParserRegistry.hasSolution(blockType, complete)).toBe(
      true,
    );
    expect(
      questionBlockParserRegistry.describeMissingSolution(blockType, complete),
    ).toBeNull();

    expect(questionBlockParserRegistry.hasSolution(blockType, incomplete)).toBe(
      false,
    );
    expect(
      questionBlockParserRegistry.describeMissingSolution(
        blockType,
        incomplete,
      ),
    ).not.toBeNull();
  });
});
