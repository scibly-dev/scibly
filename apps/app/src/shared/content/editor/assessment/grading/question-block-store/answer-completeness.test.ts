import type { QuestionBlock } from "@/shared/content/editor/assessment/parsing/base-parser/types";
import type { QuestionBlocksType } from "@/shared/content/editor/blocks/registry/shared";

import { beforeEach, describe, expect, it } from "vitest";

import { useQuestionBlockStore } from "@/shared/content/editor/assessment/grading/question-block-store";
import { questionBlockParserRegistry } from "@/shared/content/editor/assessment/parsing/parser-registry";
import { EditableState } from "@/shared/content/editor/blocks/attributes/get-default-react-block-attributes";
import { CLOZE_TEXT_NODE_NAME } from "@/shared/content/editor/blocks/questions/cloze-text/schema";
import { DRAG_AND_DROP_NODE_NAME } from "@/shared/content/editor/blocks/questions/drag-and-drop/schema";
import { FREE_FORM_INPUT_NODE_NAME } from "@/shared/content/editor/blocks/questions/free-form-input/schema";
import { INPUT_FIELD_NODE_NAME } from "@/shared/content/editor/blocks/questions/input-field/schema";
import { MATCHING_PAIRS_NODE_NAME } from "@/shared/content/editor/blocks/questions/matching-pairs/schema";
import { MULTIPLE_CHOICE_NODE_NAME } from "@/shared/content/editor/blocks/questions/multiple-choice/schema";
import { editorSchemaRegistry } from "@/shared/content/editor/blocks/registry/shared";
import { STEPS_NODE_NAME } from "@/shared/content/editor/blocks/steps/schema";

// Server gate is covered by `submission-completeness.test.ts`.

type Case = { readonly name: string; readonly answer: unknown };

type BlockTypeCases = {
  readonly blockType: QuestionBlocksType;

  readonly questionData: unknown;
  readonly answered: readonly Case[];
  readonly unanswered: readonly Case[];
};

const BLOCK_TYPES: readonly BlockTypeCases[] = [
  {
    blockType: INPUT_FIELD_NODE_NAME,
    questionData: { answer: "Paris", caseSensitive: false },
    answered: [
      { name: "a word", answer: "Lisbon" },
      { name: "a word with padding", answer: "  Paris  " },
    ],
    unanswered: [
      { name: "nothing", answer: "" },
      { name: "spaces", answer: "   " },
      { name: "a tab and a newline", answer: "\t\n" },
    ],
  },
  {
    blockType: FREE_FORM_INPUT_NODE_NAME,
    questionData: { maxLength: 200 },
    answered: [{ name: "a sentence", answer: "It felt unfair to me." }],
    unanswered: [
      { name: "nothing", answer: "" },
      { name: "spaces", answer: "   " },
    ],
  },
  {
    blockType: MULTIPLE_CHOICE_NODE_NAME,
    questionData: {
      choices: [
        { id: "c1", text: "Paris" },
        { id: "c2", text: "Lisbon" },
        { id: "c3", text: "Madrid" },
      ],
      correctChoiceIds: ["c1"],
      allowMultiple: false,
    },
    answered: [
      { name: "the right choice", answer: ["c1"] },
      { name: "a wrong choice", answer: ["c2"] },
    ],
    unanswered: [{ name: "no choice", answer: [] }],
  },
  {
    blockType: MULTIPLE_CHOICE_NODE_NAME,
    questionData: {
      choices: [
        { id: "c1", text: "Nitrogen" },
        { id: "c2", text: "Oxygen" },
        { id: "c3", text: "Argon" },
      ],
      correctChoiceIds: ["c1", "c2"],
      allowMultiple: true,
    },
    answered: [
      { name: "one of two correct choices", answer: ["c1"] },
      { name: "both correct choices", answer: ["c1", "c2"] },
    ],
    unanswered: [{ name: "no choice", answer: [] }],
  },
  {
    blockType: CLOZE_TEXT_NODE_NAME,
    questionData: {
      segments: [
        { type: "text", id: "s1", content: "The " },
        { type: "gap", id: "g1", correctItemId: "i1" },
        { type: "text", id: "s2", content: " orbits the " },
        { type: "gap", id: "g2", correctItemId: "i2" },
      ],
      items: [
        { id: "i1", label: "moon" },
        { id: "i2", label: "earth" },
      ],
    },
    answered: [
      { name: "both gaps", answer: { g1: "i1", g2: "i2" } },
      { name: "both gaps, wrongly", answer: { g1: "i2", g2: "i1" } },
    ],
    unanswered: [
      { name: "no gap", answer: {} },
      { name: "one gap of two", answer: { g1: "i1" } },
    ],
  },
  {
    blockType: MATCHING_PAIRS_NODE_NAME,
    questionData: {
      pairs: [
        { pairId: "p1", leftItemId: "l1", rightItemId: "r1" },
        { pairId: "p2", leftItemId: "l2", rightItemId: "r2" },
      ],
      rightColumnOrder: ["r2", "r1"],
    },
    answered: [
      { name: "both rows", answer: { l1: "r1", l2: "r2" } },
      { name: "both rows, wrongly", answer: { l1: "r2", l2: "r1" } },
    ],
    unanswered: [
      { name: "no row", answer: {} },
      { name: "one row of two", answer: { l1: "r1" } },
    ],
  },
  {
    blockType: DRAG_AND_DROP_NODE_NAME,
    questionData: {
      items: [
        { id: "i1", label: "Apple" },
        { id: "i2", label: "Carrot" },
        { id: "i3", label: "Pear" },
      ],
      zones: [
        { id: "z1", label: "Fruit" },
        { id: "z2", label: "Vegetable" },
      ],
      correctMappings: { i1: "z1", i2: "z2", i3: "z1" },
    },
    answered: [
      { name: "every item placed", answer: { i1: "z1", i2: "z2", i3: "z1" } },
      {
        name: "every item placed, wrongly",
        answer: { i1: "z2", i2: "z1", i3: "z2" },
      },

      { name: "one item of three", answer: { i1: "z1" } },
      { name: "two items of three", answer: { i1: "z1", i2: "z2" } },
    ],
    unanswered: [
      { name: "no item", answer: {} },
      { name: "an item whose placement was cleared", answer: { i1: "" } },
    ],
  },
  {
    blockType: STEPS_NODE_NAME,
    questionData: { stepCount: 3, firstEmptyStep: null },
    answered: [{ name: "every step opened", answer: 3 }],
    unanswered: [
      { name: "no step opened", answer: 0 },
      { name: "two steps of three", answer: 2 },
    ],
  },
];

const ALL_CASES = BLOCK_TYPES.flatMap((type) => [
  ...type.answered.map((c) => ({ ...c, type, expected: true })),
  ...type.unanswered.map((c) => ({ ...c, type, expected: false })),
]);

function asLearnerSees(type: BlockTypeCases): unknown {
  return questionBlockParserRegistry.stripSolution(
    type.blockType,
    type.questionData,
  );
}

describe("ANS1/ANS2 what counts as answered", () => {
  it("covers every question block type the editor registers", () => {
    const registered = editorSchemaRegistry
      .getQuestionDefinitions()
      .map((definition) => definition.name);
    const covered = new Set(BLOCK_TYPES.map((type) => type.blockType));

    expect([...registered].sort()).toEqual([...covered].sort());
  });

  it.each(ALL_CASES)(
    "$type.blockType — $name is answered: $expected",
    ({ type, answer, expected }) => {
      expect(
        questionBlockParserRegistry.isAnswered(
          type.blockType,
          answer,
          asLearnerSees(type),
        ),
      ).toBe(expected);
    },
  );
});

describe("ANS17 an answer that never arrived is unanswered, not an error", () => {
  it.each(
    BLOCK_TYPES.flatMap((type) =>
      [
        { name: "no answer at all", answer: undefined },
        { name: "a null answer", answer: null },
      ].map((absent) => ({ ...absent, type })),
    ),
  )("$type.blockType — $name", ({ type, answer }) => {
    expect(
      questionBlockParserRegistry.isAnswered(
        type.blockType,
        answer,
        asLearnerSees(type),
      ),
    ).toBe(false);
  });
});

describe("ANS4 the browser and the server reach the same verdict", () => {
  it.each(ALL_CASES)(
    "$type.blockType — $name reads the same stripped or whole",
    ({ type, answer }) => {
      expect(
        questionBlockParserRegistry.isAnswered(
          type.blockType,
          answer,
          asLearnerSees(type),
        ),
      ).toBe(
        questionBlockParserRegistry.isAnswered(
          type.blockType,
          answer,
          type.questionData,
        ),
      );
    },
  );
});

function question(
  overrides: Partial<QuestionBlock<unknown, unknown>> &
    Pick<QuestionBlock<unknown, unknown>, "blockId">,
): QuestionBlock<unknown, unknown> {
  const type = BLOCK_TYPES[0]!;
  return {
    blockType: type.blockType,
    optional: false,
    solution: asLearnerSees(type),
    learnerAnswer: "",
    isEditable: EditableState.Default,
    isResizable: false,
    isQuestionBlock: true,
    blockSp: 0,
    ...overrides,
  };
}

function answeredQuestion(blockId: string, type: BlockTypeCases) {
  return question({
    blockId,
    blockType: type.blockType,
    solution: asLearnerSees(type),
    learnerAnswer: type.answered[0]!.answer,
  });
}

function unansweredQuestion(blockId: string, type: BlockTypeCases) {
  return question({
    blockId,
    blockType: type.blockType,
    solution: asLearnerSees(type),
    learnerAnswer: type.unanswered[0]!.answer,
  });
}

const store = () => useQuestionBlockStore.getState();

beforeEach(() => {
  useQuestionBlockStore.getState().clear();
});

describe("ANS3 a question nobody has touched is unanswered", () => {
  it.each(BLOCK_TYPES)(
    "$blockType reports unanswered from the moment it registers",
    (type) => {
      store().registerBlock(unansweredQuestion("b1", type));

      expect(store().questionBlocks.get("b1")?.isAnswered).toBe(false);
    },
  );
});

describe("ANS5 the gate", () => {
  it("refuses a scene with an unanswered question", () => {
    store().registerBlock(unansweredQuestion("b1", BLOCK_TYPES[0]!));
    store().registerBlock(answeredQuestion("b2", BLOCK_TYPES[2]!));

    expect(store().submit()).toBe(false);
  });

  it("allows a scene once every question is answered", () => {
    for (const [index, type] of BLOCK_TYPES.entries()) {
      store().registerBlock(answeredQuestion(`b${index}`, type));
    }

    expect(store().submit()).toBe(true);
  });

  it("records what it found, so the blocks can show it", () => {
    store().registerBlock(unansweredQuestion("b1", BLOCK_TYPES[0]!));
    store().registerBlock(answeredQuestion("b2", BLOCK_TYPES[0]!));

    store().submit();

    expect(store().questionBlocks.get("b1")?.isAnswered).toBe(false);
    expect(store().questionBlocks.get("b2")?.isAnswered).toBe(true);
  });
});

describe("ANS6 an optional question never blocks", () => {
  it("lets a scene through with an optional question left blank", () => {
    store().registerBlock({
      ...unansweredQuestion("b1", BLOCK_TYPES[0]!),
      optional: true,
    });
    store().registerBlock(answeredQuestion("b2", BLOCK_TYPES[0]!));

    expect(store().submit()).toBe(true);
  });

  it("still reports the optional question as unanswered", () => {
    store().registerBlock({
      ...unansweredQuestion("b1", BLOCK_TYPES[0]!),
      optional: true,
    });

    store().submit();

    expect(store().questionBlocks.get("b1")?.isAnswered).toBe(false);
  });
});

describe("ANS7 asking is not recording", () => {
  it("leaves the store alone when only asked", () => {
    store().registerBlock(unansweredQuestion("b1", BLOCK_TYPES[0]!));
    const before = store().questionBlocks;

    store().checkIfAllAnswered(before);

    expect(store().questionBlocks).toBe(before);
  });

  it("does not touch the map it was handed", () => {
    store().registerBlock(unansweredQuestion("b1", BLOCK_TYPES[0]!));
    const handed = store().questionBlocks;
    const entryBefore = handed.get("b1");

    const { newQuestionBlocks } = store().checkIfAllAnswered(handed);

    expect(handed.get("b1")).toBe(entryBefore);
    expect(newQuestionBlocks).not.toBe(handed);
  });

  it("records only when submit is called", () => {
    store().registerBlock(answeredQuestion("b1", BLOCK_TYPES[0]!));
    const before = store().questionBlocks;

    store().submit();

    expect(store().questionBlocks).not.toBe(before);
  });
});

describe("ANS8 a question that mounts again keeps its answer", () => {
  it("does not clear an answer when the same block registers twice", () => {
    store().registerBlock(answeredQuestion("b1", BLOCK_TYPES[0]!));
    store().registerBlock(unansweredQuestion("b1", BLOCK_TYPES[0]!));

    expect(store().questionBlocks.get("b1")?.learnerAnswer).toBe(
      BLOCK_TYPES[0]!.answered[0]!.answer,
    );
    expect(store().submit()).toBe(true);
  });

  it("still lets the learner change their answer", () => {
    store().registerBlock(answeredQuestion("b1", BLOCK_TYPES[0]!));

    store().updateBlockAnswer("b1", BLOCK_TYPES[0]!.unanswered[0]!.answer);

    expect(store().submit()).toBe(false);
  });
});

describe("ANS9 a scene with no questions", () => {
  it("submits", () => {
    expect(store().submit()).toBe(true);
  });
});
