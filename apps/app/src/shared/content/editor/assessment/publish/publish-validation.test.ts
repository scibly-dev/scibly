import type { JSONContent } from "@tiptap/core";

import { getSchema, Node } from "@tiptap/core";
import { prosemirrorJSONToYDoc } from "@tiptap/y-tiptap";
import { describe, expect, it } from "vitest";
import * as Y from "yjs";

import { questionBlockParserRegistry } from "@/shared/content/editor/assessment/parsing/parser-registry";
import { validatePublishableContent } from "@/shared/content/editor/assessment/publish/publish-validation";
import { CLOZE_TEXT_NODE_NAME } from "@/shared/content/editor/blocks/questions/cloze-text/schema";
import { INPUT_FIELD_NODE_NAME } from "@/shared/content/editor/blocks/questions/input-field/schema";
import { MULTIPLE_CHOICE_NODE_NAME } from "@/shared/content/editor/blocks/questions/multiple-choice/schema";

type QuestionFixture = {
  blockType: string;
  questionData: unknown;
  maxPoints?: number;
  sp?: number;
  blockId?: string;
};

const schema = getSchema([
  Node.create({ name: "doc", topNode: true, content: "block+" }),
  Node.create({ name: "paragraph", group: "block", content: "text*" }),
  Node.create({ name: "text", group: "inline" }),
  ...[
    INPUT_FIELD_NODE_NAME,
    MULTIPLE_CHOICE_NODE_NAME,
    CLOZE_TEXT_NODE_NAME,
  ].map((name) =>
    Node.create({
      name,
      group: "block",
      atom: true,
      addAttributes: () => ({
        id: { default: null },
        isQuestionBlock: { default: true },
        questionBlockAttributes: { default: null },
      }),
    }),
  ),
]);

function documentOf(content: JSONContent[]): Buffer {
  return Buffer.from(
    Y.encodeStateAsUpdate(
      prosemirrorJSONToYDoc(schema, { type: "doc", content }, "default"),
    ),
  );
}

function sceneDocument(...questions: QuestionFixture[]): Buffer {
  return documentOf(
    questions.map(
      ({ blockType, questionData, maxPoints, sp, blockId }, index) => ({
        type: blockType,
        attrs: {
          id: blockId ?? `b${index + 1}`,
          isQuestionBlock: true,
          questionBlockAttributes: { questionData, maxPoints, sp },
        },
      }),
    ),
  );
}

function proseDocument(): Buffer {
  return documentOf([
    { type: "paragraph", content: [{ type: "text", text: "Read this." }] },
  ]);
}

const ANSWERABLE: QuestionFixture = {
  blockType: INPUT_FIELD_NODE_NAME,
  questionData: { answer: "Paris", caseSensitive: false },
};

const NO_ANSWER_KEY: QuestionFixture = {
  blockType: INPUT_FIELD_NODE_NAME,
  questionData: { answer: "", caseSensitive: false },
};

const NOTHING_MARKED_CORRECT: QuestionFixture = {
  blockType: MULTIPLE_CHOICE_NODE_NAME,
  questionData: {
    choices: [
      { id: "a", text: "Cat" },
      { id: "b", text: "Dog" },
    ],
    correctChoiceIds: [],
    allowMultiple: false,
  },
};

const GAP_WITHOUT_A_WORD: QuestionFixture = {
  blockType: CLOZE_TEXT_NODE_NAME,
  questionData: {
    segments: [
      { type: "gap", id: "g1", correctItemId: "w1" },
      { type: "text", id: "s1", content: " and " },
      { type: "gap", id: "g2", correctItemId: "" },
    ],
    items: [{ id: "w1", label: "cat" }],
  },
};

const WORTH_ZERO_POINTS: QuestionFixture = {
  ...ANSWERABLE,
  maxPoints: 0,
};

const AWARDS_ZERO_SP: QuestionFixture = {
  ...ANSWERABLE,
  sp: 0,
};

const EVERY_GAP_FILLED: QuestionFixture = {
  blockType: CLOZE_TEXT_NODE_NAME,
  questionData: {
    segments: [{ type: "gap", id: "g1", correctItemId: "w1" }],
    items: [{ id: "w1", label: "cat" }],
  },
};

function lessonOf(
  title: string,
  scenes: {
    title: string;
    documentState: Buffer | null;
    isOutdated?: boolean;
  }[],
) {
  return { title, scenes };
}

describe("SOL6: a course containing a question no learner can finish does not publish", () => {
  it("one unfinishable question among many good ones stops the whole version", () => {
    const failure = validatePublishableContent(
      [
        lessonOf("Geography", [
          {
            title: "Capitals",
            documentState: sceneDocument(ANSWERABLE, ANSWERABLE),
          },
          {
            title: "Rivers",
            documentState: sceneDocument(ANSWERABLE, NO_ANSWER_KEY),
          },
        ]),
      ],
      {},
    );

    expect(failure?.code).toBe("UNANSWERABLE_QUESTIONS");
  });

  it("a course whose every question has its answer key publishes", () => {
    expect(
      validatePublishableContent(
        [
          lessonOf("Geography", [
            { title: "Capitals", documentState: sceneDocument(ANSWERABLE) },
            { title: "Rivers", documentState: sceneDocument(EVERY_GAP_FILLED) },
          ]),
        ],
        {},
      ),
    ).toBeNull();
  });
});

describe("SOL7: the author is told about every offending question, not the first", () => {
  it("three unfinishable questions across two scenes are all reported", () => {
    const failure = validatePublishableContent(
      [
        lessonOf("Geography", [
          {
            title: "Capitals",
            documentState: sceneDocument(
              NO_ANSWER_KEY,
              ANSWERABLE,
              NOTHING_MARKED_CORRECT,
            ),
          },
          { title: "Rivers", documentState: sceneDocument(GAP_WITHOUT_A_WORD) },
        ]),
      ],
      {},
    );

    expect(failure?.questions).toHaveLength(3);
  });
});

describe("SOL8: each is named by where the author will find it", () => {
  it("scene title, position among that scene's questions, type and reason", () => {
    const failure = validatePublishableContent(
      [
        lessonOf("Geography", [
          {
            title: "Capitals",
            documentState: sceneDocument(ANSWERABLE, ANSWERABLE, NO_ANSWER_KEY),
          },
        ]),
      ],
      {},
    );

    expect(failure?.questions).toEqual([
      {
        sceneTitle: "Capitals",
        position: 3,
        blockType: INPUT_FIELD_NODE_NAME,
        reason: questionBlockParserRegistry.describeMissingSolution(
          INPUT_FIELD_NODE_NAME,
          NO_ANSWER_KEY.questionData,
        ),
      },
    ]);
  });

  it("a scene the author never named is still identifiable", () => {
    const failure = validatePublishableContent(
      [
        lessonOf("Geography", [
          { title: "", documentState: sceneDocument(NO_ANSWER_KEY) },
        ]),
      ],
      {},
    );

    expect(failure?.questions?.[0]?.sceneTitle).toBeTruthy();
  });

  it("the message stands on its own for anyone who only reads that", () => {
    const failure = validatePublishableContent(
      [
        lessonOf("Geography", [
          { title: "Capitals", documentState: sceneDocument(NO_ANSWER_KEY) },
        ]),
      ],
      {},
    );

    expect(failure?.message).toContain("Capitals");
  });
});

describe("SOL9: a scene that cannot be read is refused, and said so honestly", () => {
  const unreadable = Buffer.from("<p>Half-migrated</p>");

  it("the scene is named and the publish stops", () => {
    const failure = validatePublishableContent(
      [lessonOf("Geography", [{ title: "Rivers", documentState: unreadable }])],
      {},
    );

    expect(failure?.code).toBe("UNREADABLE_SCENE");
    expect(failure?.message).toContain("Rivers");
  });

  it("the author is not simply told to retry, because retrying does the same thing", () => {
    const failure = validatePublishableContent(
      [lessonOf("Geography", [{ title: "Rivers", documentState: unreadable }])],
      {},
    );

    expect(failure?.code).toBe("UNREADABLE_SCENE");
    expect(failure?.message).not.toMatch(/^.*please try again\.?$/i);

    expect(failure?.message).toMatch(/open the scene/i);
  });
});

describe("SOL10: a course that is structurally broken says so first", () => {
  it.each([
    ["a course with no lessons at all", [], "NO_LESSONS"],
    [
      "a lesson with no scenes",
      [
        lessonOf("Geography", []),
        lessonOf("History", [
          { title: "Rome", documentState: sceneDocument(NO_ANSWER_KEY) },
        ]),
      ],
      "EMPTY_LESSON",
    ],
    [
      "a scene with no content",
      [
        lessonOf("Geography", [
          { title: "Empty", documentState: null },
          { title: "Rivers", documentState: sceneDocument(NO_ANSWER_KEY) },
        ]),
      ],
      "EMPTY_SCENE",
    ],
  ])("%s outranks an unfinishable question", (_case, lessons, code) => {
    expect(validatePublishableContent(lessons, {})?.code).toBe(code);
  });
});

describe("SOL11: publishing anyway is not a way past an unfinishable question", () => {
  it("force does not waive it", () => {
    const failure = validatePublishableContent(
      [
        lessonOf("Geography", [
          { title: "Rivers", documentState: sceneDocument(NO_ANSWER_KEY) },
        ]),
      ],
      { force: true },
    );

    expect(failure?.code).toBe("UNANSWERABLE_QUESTIONS");
  });

  it("an unfinishable question is reported ahead of a changed source, which force could have waived", () => {
    const failure = validatePublishableContent(
      [
        lessonOf("Geography", [
          {
            title: "Rivers",
            documentState: sceneDocument(NO_ANSWER_KEY),
            isOutdated: true,
          },
        ]),
      ],
      {},
    );

    expect(failure?.code).toBe("UNANSWERABLE_QUESTIONS");
  });
});

describe("SOL11b: a changed source is still the author's call to make", () => {
  it("publishing anyway still works when every question has its key", () => {
    expect(
      validatePublishableContent(
        [
          lessonOf("Geography", [
            {
              title: "Rivers",
              documentState: sceneDocument(ANSWERABLE),
              isOutdated: true,
            },
          ]),
        ],
        { force: true },
      ),
    ).toBeNull();
  });

  it("and without publishing anyway, the changed source is still what stops it", () => {
    expect(
      validatePublishableContent(
        [
          lessonOf("Geography", [
            {
              title: "Rivers",
              documentState: sceneDocument(ANSWERABLE),
              isOutdated: true,
            },
          ]),
        ],
        {},
      )?.code,
    ).toBe("OUTDATED_SCENES");
  });
});

describe("SOL12: a course that asks nothing is not an incomplete course", () => {
  it("scenes of pure reading material publish", () => {
    expect(
      validatePublishableContent(
        [
          lessonOf("Geography", [
            { title: "Intro", documentState: proseDocument() },
            { title: "Background", documentState: proseDocument() },
          ]),
        ],
        {},
      ),
    ).toBeNull();
  });
});

describe("SOL23: a course containing a zero-value question does not publish", () => {
  it("a question authored with maxPoints of exactly 0 refuses the whole course", () => {
    const failure = validatePublishableContent(
      [
        lessonOf("Geography", [
          {
            title: "Capitals",
            documentState: sceneDocument(WORTH_ZERO_POINTS),
          },
        ]),
      ],
      {},
    );

    expect(failure?.code).toBe("ZERO_VALUE_QUESTIONS");
  });

  it("a question authored with sp of exactly 0 refuses the whole course", () => {
    const failure = validatePublishableContent(
      [
        lessonOf("Geography", [
          { title: "Capitals", documentState: sceneDocument(AWARDS_ZERO_SP) },
        ]),
      ],
      {},
    );

    expect(failure?.code).toBe("ZERO_VALUE_QUESTIONS");
  });

  it("every offending question is named, not just the first", () => {
    const failure = validatePublishableContent(
      [
        lessonOf("Geography", [
          {
            title: "Capitals",
            documentState: sceneDocument(ANSWERABLE, WORTH_ZERO_POINTS),
          },
          { title: "Rivers", documentState: sceneDocument(AWARDS_ZERO_SP) },
        ]),
      ],
      {},
    );

    expect(failure?.questions).toEqual([
      {
        sceneTitle: "Capitals",
        position: 2,
        blockType: INPUT_FIELD_NODE_NAME,
        reason: "worth zero points",
      },
      {
        sceneTitle: "Rivers",
        position: 1,
        blockType: INPUT_FIELD_NODE_NAME,
        reason: "awards zero SP",
      },
    ]);
  });

  it("a question failing both maxPoints and sp reports only the maxPoints reason", () => {
    const failure = validatePublishableContent(
      [
        lessonOf("Geography", [
          {
            title: "Capitals",
            documentState: sceneDocument({ ...WORTH_ZERO_POINTS, sp: 0 }),
          },
        ]),
      ],
      {},
    );

    expect(failure?.questions).toEqual([
      {
        sceneTitle: "Capitals",
        position: 1,
        blockType: INPUT_FIELD_NODE_NAME,
        reason: "worth zero points",
      },
    ]);
  });

  it("an unanswerable question is reported ahead of a zero-value one, not alongside it", () => {
    const failure = validatePublishableContent(
      [
        lessonOf("Geography", [
          {
            title: "Capitals",
            documentState: sceneDocument(NO_ANSWER_KEY, WORTH_ZERO_POINTS),
          },
        ]),
      ],
      {},
    );

    expect(failure?.code).toBe("UNANSWERABLE_QUESTIONS");
  });

  it("a course with only zero-value questions is not an unanswerable-question failure", () => {
    const failure = validatePublishableContent(
      [
        lessonOf("Geography", [
          {
            title: "Capitals",
            documentState: sceneDocument(WORTH_ZERO_POINTS),
          },
        ]),
      ],
      {},
    );

    expect(failure?.code).not.toBe("UNANSWERABLE_QUESTIONS");
  });

  it("publishing anyway does not waive it", () => {
    const failure = validatePublishableContent(
      [
        lessonOf("Geography", [
          {
            title: "Capitals",
            documentState: sceneDocument(WORTH_ZERO_POINTS),
          },
        ]),
      ],
      { force: true },
    );

    expect(failure?.code).toBe("ZERO_VALUE_QUESTIONS");
  });

  it("a course whose every question has a positive value and SP publishes", () => {
    expect(
      validatePublishableContent(
        [
          lessonOf("Geography", [
            { title: "Capitals", documentState: sceneDocument(ANSWERABLE) },
          ]),
        ],
        {},
      ),
    ).toBeNull();
  });
});

describe("F9: a duplicate blockId in a scene does not publish", () => {
  it("two questions sharing a blockId refuse the whole course", () => {
    const failure = validatePublishableContent(
      [
        lessonOf("Geography", [
          {
            title: "Capitals",
            documentState: sceneDocument(
              { ...ANSWERABLE, blockId: "dup" },
              { ...ANSWERABLE, blockId: "dup" },
            ),
          },
        ]),
      ],
      {},
    );

    expect(failure?.code).toBe("DUPLICATE_BLOCK_ID");
    expect(failure?.message).toContain("Capitals");
  });

  it("publishing anyway does not waive it", () => {
    const failure = validatePublishableContent(
      [
        lessonOf("Geography", [
          {
            title: "Capitals",
            documentState: sceneDocument(
              { ...ANSWERABLE, blockId: "dup" },
              { ...ANSWERABLE, blockId: "dup" },
            ),
          },
        ]),
      ],
      { force: true },
    );

    expect(failure?.code).toBe("DUPLICATE_BLOCK_ID");
  });

  it("a course with only unique blockIds publishes", () => {
    expect(
      validatePublishableContent(
        [
          lessonOf("Geography", [
            {
              title: "Capitals",
              documentState: sceneDocument(ANSWERABLE, ANSWERABLE),
            },
          ]),
        ],
        {},
      ),
    ).toBeNull();
  });
});
