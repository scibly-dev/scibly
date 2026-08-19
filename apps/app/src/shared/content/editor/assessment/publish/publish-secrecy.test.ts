import type { JSONContent } from "@tiptap/core";

import { describe, expect, it } from "vitest";

import { buildPublishArtifacts } from "@/shared/content/editor/assessment/publish/publish-artifacts";
import { CLOZE_TEXT_NODE_NAME } from "@/shared/content/editor/blocks/questions/cloze-text/schema";
import { DRAG_AND_DROP_NODE_NAME } from "@/shared/content/editor/blocks/questions/drag-and-drop/schema";
import { FREE_FORM_INPUT_NODE_NAME } from "@/shared/content/editor/blocks/questions/free-form-input/schema";
import { INPUT_FIELD_NODE_NAME } from "@/shared/content/editor/blocks/questions/input-field/schema";
import {
  MATCHING_PAIR_NODE_NAME,
  MATCHING_PAIR_SIDE_NODE_NAME,
  MATCHING_PAIRS_NODE_NAME,
  type QuestionData as MatchingPairsQuestionData,
} from "@/shared/content/editor/blocks/questions/matching-pairs/schema";
import { getRightTileIds } from "@/shared/content/editor/blocks/questions/matching-pairs/utils/matching-pairs-data";
import { MULTIPLE_CHOICE_NODE_NAME } from "@/shared/content/editor/blocks/questions/multiple-choice/schema";
import {
  buildLearnerTipTapContent,
  extractQuestionBlockSnapshotsFromTipTap,
} from "@/shared/content/editor/documents/tiptap-document";

function publish(authorContent: JSONContent) {
  const artifacts = buildPublishArtifacts(
    extractQuestionBlockSnapshotsFromTipTap(authorContent),
  );
  return {
    gradingManifest: artifacts.gradingManifest,
    learnerContent: buildLearnerTipTapContent(
      authorContent,
      artifacts.learnerDocument,
    ),
  };
}

function collectStrings(value: unknown, found: string[] = []): string[] {
  if (typeof value === "string") found.push(value);
  else if (Array.isArray(value))
    for (const entry of value) collectStrings(entry, found);
  else if (value && typeof value === "object")
    for (const entry of Object.values(value)) collectStrings(entry, found);
  return found;
}

function findBlock(payload: JSONContent, type: string): JSONContent {
  const found = (payload.content ?? []).find((node) => node.type === type);
  if (!found) throw new Error(`No ${type} in the published payload`);
  return found;
}

function publishedRightItemIds(block: JSONContent): string[] {
  return (block.content ?? []).flatMap((pair) =>
    (pair.content ?? [])
      .filter((side) => side.attrs?.side === "right")
      .map((side) => side.attrs?.itemId as string),
  );
}

function expectSameToTheLearner(a: JSONContent, b: JSONContent) {
  expect(publish(a).learnerContent).toEqual(publish(b).learnerContent);
}

function questionNode(
  type: string,
  id: string,
  questionData: unknown,
  content?: JSONContent[],
): JSONContent {
  return {
    type,
    attrs: {
      id,
      isQuestionBlock: true,
      questionBlockAttributes: {
        optional: false,
        maxPoints: 4,
        sp: 10,
        questionData,
      },
    },
    content,
  };
}

function authorDocument(...blocks: JSONContent[]): JSONContent {
  return {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "Lesson intro" }] },
      ...blocks,
    ],
  };
}

const CHOICE_TEXTS = { c1: "Lisbon", c2: "Madrid", c3: "Porto" };

function multipleChoice(correctChoiceIds: string[]) {
  return questionNode(MULTIPLE_CHOICE_NODE_NAME, "mc-1", {
    choices: Object.entries(CHOICE_TEXTS).map(([id, text]) => ({ id, text })),
    correctChoiceIds,
    allowMultiple: false,
  });
}

const WORD_LABELS = { w1: "sun", w2: "moon" };

function cloze(correctItemId: string) {
  return questionNode(CLOZE_TEXT_NODE_NAME, "cz-1", {
    segments: [
      { type: "text", id: "s1", content: "The " },
      { type: "gap", id: "g1", correctItemId },
      { type: "text", id: "s2", content: " rises." },
    ],
    items: Object.entries(WORD_LABELS).map(([id, label]) => ({ id, label })),
  });
}

function dragAndDrop(correctMappings: Record<string, string>) {
  return questionNode(DRAG_AND_DROP_NODE_NAME, "dd-1", {
    items: [
      { id: "i1", label: "Apple" },
      { id: "i2", label: "Carrot" },
    ],
    zones: [
      { id: "z1", label: "Fruit" },
      { id: "z2", label: "Vegetable" },
    ],
    correctMappings,
  });
}

function inputField(answer: string) {
  return questionNode(INPUT_FIELD_NODE_NAME, "if-1", {
    answer,
    caseSensitive: false,
  });
}

function freeForm() {
  return questionNode(FREE_FORM_INPUT_NODE_NAME, "ff-1", {
    minLength: 10,
    maxLength: 200,
  });
}

const PAIR_LABELS = {
  l1: "France",
  l2: "Portugal",
  r1: "Paris",
  r2: "Lisbon",
};

function side(itemId: keyof typeof PAIR_LABELS, side: "left" | "right") {
  return {
    type: MATCHING_PAIR_SIDE_NODE_NAME,
    attrs: { side, itemId },
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: PAIR_LABELS[itemId] }],
      },
    ],
  };
}

function matchingPairs(pairing: Record<"l1" | "l2", "r1" | "r2">) {
  const rows = (["l1", "l2"] as const).map((leftItemId, index) => ({
    pairId: `p${index + 1}`,
    leftItemId,
    rightItemId: pairing[leftItemId],
  }));
  return questionNode(
    MATCHING_PAIRS_NODE_NAME,
    "mp-1",

    { pairs: rows, rightColumnOrder: ["r1", "r2"] },
    rows.map((row) => ({
      type: MATCHING_PAIR_NODE_NAME,
      attrs: { id: row.pairId },
      content: [
        side(row.leftItemId as "l1" | "l2", "left"),
        side(row.rightItemId as "r1" | "r2", "right"),
      ],
    })),
  );
}

describe("SEC1 a published scene permits no recovery of any answer", () => {
  it("publishes the same scene whichever answers the author chose", () => {
    expectSameToTheLearner(
      authorDocument(
        multipleChoice(["c1"]),
        cloze("w1"),
        dragAndDrop({ i1: "z1", i2: "z2" }),
        inputField("Lisbon"),
        matchingPairs({ l1: "r1", l2: "r2" }),
        freeForm(),
      ),
      authorDocument(
        multipleChoice(["c3"]),
        cloze("w2"),
        dragAndDrop({ i1: "z2", i2: "z1" }),
        inputField("Madrid"),
        matchingPairs({ l1: "r2", l2: "r1" }),
        freeForm(),
      ),
    );
  });
});

describe("the guarantee, per block type", () => {
  it("SEC2 multiple choice — which choices are correct", () => {
    expectSameToTheLearner(
      authorDocument(multipleChoice(["c1"])),
      authorDocument(multipleChoice(["c3"])),
    );
  });

  it("SEC3 cloze — which word answers which gap", () => {
    expectSameToTheLearner(
      authorDocument(cloze("w1")),
      authorDocument(cloze("w2")),
    );
  });

  it("SEC4 drag and drop — which item belongs in which zone", () => {
    expectSameToTheLearner(
      authorDocument(dragAndDrop({ i1: "z1", i2: "z2" })),
      authorDocument(dragAndDrop({ i1: "z2", i2: "z1" })),
    );
  });

  it("SEC5 input field — the expected answer", () => {
    expectSameToTheLearner(
      authorDocument(inputField("Lisbon")),
      authorDocument(inputField("Madrid")),
    );
  });

  it("SEC5 input field — the answer text appears nowhere in the payload", () => {
    const published = publish(authorDocument(inputField("Lisbon")));
    expect(collectStrings(published.learnerContent)).not.toContain("Lisbon");
  });

  it("SEC6 matching pairs — the left→right pairing", () => {
    expectSameToTheLearner(
      authorDocument(matchingPairs({ l1: "r1", l2: "r2" })),
      authorDocument(matchingPairs({ l1: "r2", l2: "r1" })),
    );
  });

  it("SEC7 free form is published unchanged", () => {
    const authored = authorDocument(freeForm());
    expect(publish(authored).learnerContent).toEqual(authored);
  });
});

describe("SEC8 the document", () => {
  function publishedRightSides(pairing: Record<"l1" | "l2", "r1" | "r2">) {
    const rows: (string | undefined)[] = [];
    const visit = (node: JSONContent) => {
      if (node.type === MATCHING_PAIR_NODE_NAME) {
        rows.push(
          (node.content ?? []).find((child) => child.attrs?.side === "right")
            ?.attrs?.itemId as string | undefined,
        );
      }
      node.content?.forEach(visit);
    };
    visit(publish(authorDocument(matchingPairs(pairing))).learnerContent);
    return rows;
  }

  it("puts the same right side in each row whatever the author paired", () => {
    const rows = publishedRightSides({ l1: "r1", l2: "r2" });

    expect(rows).toEqual(publishedRightSides({ l1: "r2", l2: "r1" }));

    expect(rows).toHaveLength(2);
    expect(rows.every((itemId) => typeof itemId === "string")).toBe(true);
  });
});

describe("SEC9 redaction leaves every question answerable", () => {
  it.each([
    {
      name: "multiple choice keeps its choice text",
      block: multipleChoice(["c1"]),
      expected: Object.values(CHOICE_TEXTS),
    },
    {
      name: "cloze keeps its sentence and word bank",
      block: cloze("w1"),
      expected: [...Object.values(WORD_LABELS), "The ", " rises."],
    },
    {
      name: "drag and drop keeps its items and zones",
      block: dragAndDrop({ i1: "z1", i2: "z2" }),
      expected: ["Apple", "Carrot", "Fruit", "Vegetable"],
    },
    {
      name: "matching pairs keeps both columns",
      block: matchingPairs({ l1: "r1", l2: "r2" }),
      expected: Object.values(PAIR_LABELS),
    },
  ])("$name", ({ block, expected }) => {
    const strings = collectStrings(
      publish(authorDocument(block)).learnerContent,
    );
    for (const value of expected) expect(strings).toContain(value);
  });

  it("cloze still presents a gap to fill", () => {
    const strings = collectStrings(
      publish(authorDocument(cloze("w1"))).learnerContent,
    );
    expect(strings).toContain("gap");
  });

  it("matching pairs still names the tiles its right column is built from", () => {
    const published = publish(
      authorDocument(matchingPairs({ l1: "r1", l2: "r2" })),
    );
    const block = findBlock(published.learnerContent, MATCHING_PAIRS_NODE_NAME);
    const questionData = block.attrs?.questionBlockAttributes
      .questionData as MatchingPairsQuestionData;

    expect(getRightTileIds(questionData).toSorted()).toEqual(
      publishedRightItemIds(block).toSorted(),
    );

    expect(getRightTileIds(questionData)).toHaveLength(2);
  });
});

describe("failing closed", () => {
  it.each([
    {
      name: "SEC10 a block type with no registered parser",
      block: questionNode("custom-not-a-question", "x-1", { answer: "Lisbon" }),
    },
    {
      name: "SEC10 questionData that is null",
      block: questionNode(MULTIPLE_CHOICE_NODE_NAME, "mc-1", null),
    },
    {
      name: "SEC10 questionData that is undefined",
      block: questionNode(MULTIPLE_CHOICE_NODE_NAME, "mc-1", undefined),
    },
    {
      name: "SEC10 questionData that is not the shape the parser expects",
      block: questionNode(MULTIPLE_CHOICE_NODE_NAME, "mc-1", "not an object"),
    },
    {
      name: "SEC10 a block whose attributes cannot be read",
      block: {
        type: MULTIPLE_CHOICE_NODE_NAME,
        attrs: { id: "mc-1", isQuestionBlock: true },
      },
    },
    {
      name: "SEC10 a block with no id to redact against",
      block: {
        ...questionNode(MULTIPLE_CHOICE_NODE_NAME, "mc-1", {
          choices: Object.entries(CHOICE_TEXTS).map(([id, text]) => ({
            id,
            text,
          })),
          correctChoiceIds: ["c1"],
          allowMultiple: false,
        }),
        attrs: {
          isQuestionBlock: true,
          questionBlockAttributes: { optional: false, questionData: {} },
        },
      },
    },
    {
      name: "SEC11 questionData carrying a field its block type does not define",
      block: questionNode(MULTIPLE_CHOICE_NODE_NAME, "mc-1", {
        choices: Object.entries(CHOICE_TEXTS).map(([id, text]) => ({
          id,
          text,
        })),
        correctChoiceIds: ["c1"],
        allowMultiple: false,
        hintForTheAnswer: "c1",
      }),
    },
  ])("$name aborts the publish", ({ block }) => {
    expect(() => publish(authorDocument(block))).toThrow();
  });

  it("SEC10 produces no learner content when a later block cannot be stripped", () => {
    expect(() =>
      publish(
        authorDocument(
          multipleChoice(["c1"]),
          questionNode(CLOZE_TEXT_NODE_NAME, "cz-1", null),
        ),
      ),
    ).toThrow();
  });
});

describe("publishing integrity", () => {
  it("SEC12 the grading manifest keeps the answer key unredacted", () => {
    const a = publish(authorDocument(multipleChoice(["c1"])));
    const b = publish(authorDocument(multipleChoice(["c3"])));

    expect(a.gradingManifest).not.toEqual(b.gradingManifest);
    expect(collectStrings(a.gradingManifest)).toContain("c1");
  });

  it("SEC13 publishing does not mutate the author document", () => {
    const authored = authorDocument(
      multipleChoice(["c1"]),
      matchingPairs({ l1: "r1", l2: "r2" }),
      inputField("Lisbon"),
    );
    const before = structuredClone(authored);
    publish(authored);
    expect(authored).toEqual(before);
  });

  it("SEC14 the same author document publishes identical artifacts every time", () => {
    const authored = authorDocument(
      multipleChoice(["c1"]),
      cloze("w1"),
      matchingPairs({ l1: "r1", l2: "r2" }),
    );
    expect(publish(authored)).toEqual(publish(authored));
  });

  it("SEC15 a learner block keeps the authoring fields and drops runtime residue", () => {
    const block = multipleChoice(["c1"]);
    block.attrs!.questionBlockAttributes = {
      ...block.attrs!.questionBlockAttributes,
      userAnswers: ["c1"],
      achievedPoints: 4,
    };

    const published = publish(authorDocument(block));
    const learnerAttributes = published.learnerContent.content?.find(
      (node) => node.attrs?.id === "mc-1",
    )?.attrs?.questionBlockAttributes;

    expect(learnerAttributes).toMatchObject({
      optional: false,
      maxPoints: 4,
      sp: 10,
    });
    expect(learnerAttributes).not.toHaveProperty("userAnswers");
    expect(learnerAttributes).not.toHaveProperty("achievedPoints");
  });
});
