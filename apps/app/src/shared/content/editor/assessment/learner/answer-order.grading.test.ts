import type { QuestionBlocksType } from "@/shared/content/editor/blocks/registry/shared";

import { describe, expect, it } from "vitest";

import { questionBlockParserRegistry } from "@/shared/content/editor/assessment/parsing/parser-registry";
import {
  CLOZE_TEXT_NODE_NAME,
  type QuestionData as ClozeQuestionData,
  type UserAnswer as ClozeUserAnswer,
} from "@/shared/content/editor/blocks/questions/cloze-text/schema";
import {
  DRAG_AND_DROP_NODE_NAME,
  type QuestionData as DragAndDropQuestionData,
  type UserAnswer as DragAndDropUserAnswer,
} from "@/shared/content/editor/blocks/questions/drag-and-drop/schema";
import {
  MATCHING_PAIRS_NODE_NAME,
  type QuestionData as MatchingPairsQuestionData,
  type UserAnswer as MatchingPairsUserAnswer,
} from "@/shared/content/editor/blocks/questions/matching-pairs/schema";
import {
  MULTIPLE_CHOICE_NODE_NAME,
  type QuestionData as MultipleChoiceQuestionData,
  type UserAnswer as MultipleChoiceUserAnswer,
} from "@/shared/content/editor/blocks/questions/multiple-choice/schema";

import { orderCandidatesForLearner } from "./answer-order";

/**
 * Metamorphic: instead of hardcoding an expected score, each case asserts the
 * reordered question grades identically to the authored one, and that its
 * answers span more than one (and a positive) score, so a fixture that grades
 * zero throughout can't pass vacuously.
 */

const SEED = "block-1|enrolment-a|0";

const reorder = <T>(values: readonly T[], id: (value: T) => string): T[] => {
  const byId = new Map(values.map((value) => [id(value), value]));
  return orderCandidatesForLearner(values.map(id), SEED).map(
    (key) => byId.get(key)!,
  );
};

type OrderCase<QuestionData, UserAnswer> = {
  blockType: QuestionBlocksType;
  authored: QuestionData;

  displayed: (authored: QuestionData) => QuestionData;
  answers: UserAnswer[];
};

const multipleChoice: OrderCase<
  MultipleChoiceQuestionData,
  MultipleChoiceUserAnswer
> = {
  blockType: MULTIPLE_CHOICE_NODE_NAME,
  authored: {
    choices: [
      { id: "c1", text: "Paris" },
      { id: "c2", text: "Rome" },
      { id: "c3", text: "Madrid" },
      { id: "c4", text: "Lisbon" },
    ],
    correctChoiceIds: ["c1"],
    allowMultiple: false,
  },
  displayed: (authored) => ({
    ...authored,
    choices: reorder(authored.choices, (choice) => choice.id),
  }),
  answers: [["c1"], ["c3"], []],
};

const clozeText: OrderCase<ClozeQuestionData, ClozeUserAnswer> = {
  blockType: CLOZE_TEXT_NODE_NAME,
  authored: {
    segments: [
      { type: "text", id: "s1", content: "The " },
      { type: "gap", id: "g1", correctItemId: "i1" },
      { type: "text", id: "s2", content: " rises and the " },
      { type: "gap", id: "g2", correctItemId: "i2" },
      { type: "text", id: "s3", content: " sets." },
    ],
    items: [
      { id: "i1", label: "sun" },
      { id: "i2", label: "moon" },
      { id: "i3", label: "tide" },
    ],
  },

  displayed: (authored) => ({
    ...authored,
    items: reorder(authored.items, (item) => item.id),
  }),
  answers: [{ g1: "i1", g2: "i2" }, { g1: "i2", g2: "i1" }, { g1: "i1" }, {}],
};

const dragAndDrop: OrderCase<DragAndDropQuestionData, DragAndDropUserAnswer> = {
  blockType: DRAG_AND_DROP_NODE_NAME,
  authored: {
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
  displayed: (authored) => ({
    ...authored,
    items: reorder(authored.items, (item) => item.id),
  }),
  answers: [
    { i1: "z1", i2: "z2", i3: "z1" },
    { i1: "z2", i2: "z1", i3: "z1" },
    { i1: "z1" },
    {},
  ],
};

const matchingPairs: OrderCase<
  MatchingPairsQuestionData,
  MatchingPairsUserAnswer
> = {
  blockType: MATCHING_PAIRS_NODE_NAME,
  authored: {
    pairs: [
      { pairId: "p1", leftItemId: "l1", rightItemId: "r1" },
      { pairId: "p2", leftItemId: "l2", rightItemId: "r2" },
      { pairId: "p3", leftItemId: "l3", rightItemId: "r3" },
    ],
    rightColumnOrder: ["r1", "r2", "r3"],
  },
  displayed: (authored) => ({
    ...authored,
    rightColumnOrder: orderCandidatesForLearner(
      authored.rightColumnOrder,
      SEED,
    ),
  }),
  answers: [
    { l1: "r1", l2: "r2", l3: "r3" },
    { l1: "r2", l2: "r1", l3: "r3" },
    { l1: "r1" },
    {},
  ],
};

function describeOrderCase<QuestionData, UserAnswer>(
  subject: OrderCase<QuestionData, UserAnswer>,
) {
  const gradeAuthored = (answer: UserAnswer) =>
    questionBlockParserRegistry.getPoints<
      QuestionBlocksType,
      QuestionData,
      UserAnswer
    >(subject.blockType, subject.authored, answer);

  const gradeDisplayed = (answer: UserAnswer) =>
    questionBlockParserRegistry.getPoints<
      QuestionBlocksType,
      QuestionData,
      UserAnswer
    >(subject.blockType, subject.displayed(subject.authored), answer);

  describe(subject.blockType, () => {
    it("shows the candidates in an order other than the authored one", () => {
      expect(subject.displayed(subject.authored)).not.toEqual(subject.authored);
    });

    it("grades the fixture answers across a range of scores", () => {
      const scores = subject.answers.map(gradeAuthored);

      expect(new Set(scores).size).toBeGreaterThan(1);
      expect(Math.max(...scores)).toBeGreaterThan(0);
    });

    it.each(subject.answers.map((answer) => ({ answer })))(
      "grades $answer identically",
      ({ answer }) => {
        expect(gradeDisplayed(answer)).toBe(gradeAuthored(answer));
      },
    );

    it("reports the same maximum points", () => {
      const maxPoints = (solution: QuestionData) =>
        questionBlockParserRegistry.getMaxPoints<
          QuestionBlocksType,
          QuestionData,
          UserAnswer
        >(subject.blockType, solution);

      expect(maxPoints(subject.displayed(subject.authored))).toBe(
        maxPoints(subject.authored),
      );
    });
  });
}

describe("reordering the candidates changes no grade", () => {
  describeOrderCase(multipleChoice);
  describeOrderCase(clozeText);
  describeOrderCase(dragAndDrop);
  describeOrderCase(matchingPairs);
});
