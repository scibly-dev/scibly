import type {
  BlockSubmission,
  PublishArtifacts,
  StoredGradingManifest,
} from "@/shared/content/contracts";

import { AppError } from "@scibly/api/application-error";
import { describe, expect, it } from "vitest";

import { INPUT_FIELD_NODE_NAME } from "@/shared/content/editor/blocks/questions/input-field/schema";

import { gradeContentSubmissions } from "./grading";

/**
 * Uses real parsers rather than mocks; the `input-field` fixtures only exist
 * to produce a known partial score, not to test that scheme.
 */

type Manifest = PublishArtifacts["gradingManifest"];

const FOUR_WORDS = "the cat sat down";

const SIX_WORDS = "the cat sat down over there";

function manifest(
  overrides: Partial<Manifest[number]> & { blockId?: string } = {},
): Manifest {
  return [
    {
      blockId: "b1",
      blockType: INPUT_FIELD_NODE_NAME,
      questionData: { answer: FOUR_WORDS, caseSensitive: false },
      sp: 10,
      ...overrides,
    },
  ];
}

/**
 * Publishing can never write a `blockType` the registry doesn't define, but a
 * stored row can hold one — this builds that case for the `GR11` tests below.
 */
function storedManifest(blockType: string): StoredGradingManifest {
  return [
    {
      blockId: "b1",
      blockType,
      questionData: { answer: FOUR_WORDS, caseSensitive: false },
      sp: 10,
    },
  ];
}

function answered(learnerAnswer: string, blockId = "b1"): BlockSubmission[] {
  return [{ blockId, blockType: INPUT_FIELD_NODE_NAME, learnerAnswer }];
}

const HALF_RIGHT = "the cat no no";

const THREE_WORDS = "the cat sat";
const TWO_OF_THREE = "the cat no";

const SCENE_SP = 25;

function grade(
  blocks: BlockSubmission[] | undefined,
  entries: StoredGradingManifest = manifest(),
  sceneSp = SCENE_SP,
) {
  return gradeContentSubmissions(blocks, entries, sceneSp);
}

describe("what a scene pays", () => {
  it("GR1: a submission that reaches grading earns the scene's base SP even when every answer is wrong", () => {
    const result = grade(answered("no no no no"));

    expect(result.gradedBlocks[0]?.achievedPoints).toBe(0);
    expect(result.totalSpEarned).toBe(SCENE_SP);
  });

  it("GR2: a scene that asks nothing earns its base SP", () => {
    const result = grade(undefined, []);

    expect(result).toEqual({ gradedBlocks: [], totalSpEarned: SCENE_SP });
  });

  it("GR3: a half-right answer earns half the question's SP", () => {
    const result = grade(answered(HALF_RIGHT));

    expect(result.gradedBlocks[0]?.achievedPoints).toBe(0.5);
    expect(result.gradedBlocks[0]?.spEarned).toBe(5);
  });

  it("GR4: SP that does not divide evenly is rounded down", () => {
    const result = grade(
      answered(TWO_OF_THREE),
      manifest({ questionData: { answer: THREE_WORDS, caseSensitive: false } }),
    );

    expect(result.gradedBlocks[0]?.spEarned).toBe(6);
  });

  it("GR4: points keep their fractions", () => {
    const result = grade(
      answered("the no no no"),
      manifest({ questionData: { answer: THREE_WORDS, caseSensitive: false } }),
    );

    expect(result.gradedBlocks[0]?.achievedPoints).toBe(0.25);
  });

  it("GR5: a question published with no SP earns none, however right the answer", () => {
    const result = grade(answered(FOUR_WORDS), manifest({ sp: undefined }));

    expect(result.gradedBlocks[0]?.achievedPoints).toBe(1);
    expect(result.gradedBlocks[0]?.spEarned).toBe(0);
    expect(result.totalSpEarned).toBe(SCENE_SP);
  });

  it("GR6: the total is the scene's base SP plus its questions'", () => {
    const twoQuestions: Manifest = [
      ...manifest(),
      ...manifest({ blockId: "b2", sp: 4 }),
    ];

    const result = grade(
      [...answered(FOUR_WORDS), ...answered(HALF_RIGHT, "b2")],
      twoQuestions,
    );

    expect(result.gradedBlocks.map((block) => block.spEarned)).toEqual([10, 2]);
    expect(result.totalSpEarned).toBe(SCENE_SP + 12);
  });
});

describe("what a question is worth", () => {
  it("GR7: the author's maximum wins over the marking scheme's", () => {
    const result = grade(answered(FOUR_WORDS), manifest({ maxPoints: 4 }));

    expect(result.gradedBlocks[0]?.maxPoints).toBe(4);
  });

  it("GR7: the marking scheme's maximum applies when the author set none", () => {
    const result = grade(answered(FOUR_WORDS));

    expect(result.gradedBlocks[0]?.maxPoints).toBe(1);
  });

  it("GR8: an answer scoring above the author's cap is marked at the cap, and paid in full", () => {
    const result = grade(
      answered(SIX_WORDS),
      manifest({
        questionData: { answer: SIX_WORDS, caseSensitive: false },
        maxPoints: 1,
      }),
    );

    expect(result.gradedBlocks[0]?.achievedPoints).toBe(1);
    expect(result.gradedBlocks[0]?.spEarned).toBe(10);
  });

  it("GR9: a blank optional question scores nothing and leaves the rest of the scene alone", () => {
    const twoQuestions: Manifest = [
      ...manifest(),
      ...manifest({ blockId: "b2", sp: 4 }),
    ];

    const result = grade(
      [...answered(""), ...answered(FOUR_WORDS, "b2")],
      twoQuestions,
    );

    expect(result.gradedBlocks[0]).toMatchObject({
      achievedPoints: 0,
      spEarned: 0,
    });
    expect(result.gradedBlocks[1]?.spEarned).toBe(4);
    expect(result.totalSpEarned).toBe(SCENE_SP + 4);
  });
});

describe("what grading refuses", () => {
  it("GR10: a submission carrying the same question twice is refused", () => {
    expect(() =>
      grade([...answered(FOUR_WORDS), ...answered(HALF_RIGHT)]),
    ).toThrow(AppError);
  });

  it("GR11: a question whose published data cannot be marked refuses the submission", () => {
    expect(() =>
      grade(answered(FOUR_WORDS), manifest({ questionData: { wrong: true } })),
    ).toThrow(AppError);
  });

  it("GR11: a question of a type with no marking scheme refuses the submission", () => {
    expect(() =>
      grade(answered(FOUR_WORDS), storedManifest("custom-riddle")),
    ).toThrow(
      expect.objectContaining({
        applicationCode: "grading.unknown_question_type",
      }),
    );
  });

  it("GR11: the refusal covers the whole scene, not just the broken question", () => {
    const twoQuestions: Manifest = [
      ...manifest({ questionData: { wrong: true } }),
      ...manifest({ blockId: "b2", sp: 4 }),
    ];

    expect(() =>
      grade(
        [...answered(FOUR_WORDS), ...answered(FOUR_WORDS, "b2")],
        twoQuestions,
      ),
    ).toThrow(AppError);
  });

  it("GR14: a submission claiming a different question type than the scene published is refused", () => {
    const mislabelled: BlockSubmission[] = [
      {
        blockId: "b1",
        blockType: "custom-free-form-input",
        learnerAnswer: FOUR_WORDS,
      },
    ];

    expect(() => grade(mislabelled)).toThrow(AppError);
  });

  it("GR16: a manifest entry authored with maxPoints of exactly 0 is refused, not marked", () => {
    expect(() =>
      grade(answered(FOUR_WORDS), manifest({ maxPoints: 0 })),
    ).toThrow(
      expect.objectContaining({
        applicationCode: "grading.question_worth_zero_points",
      }),
    );
  });

  it("GR17: a manifest entry authored with sp of exactly 0 is refused, not paid zero SP", () => {
    expect(() => grade(answered(FOUR_WORDS), manifest({ sp: 0 }))).toThrow(
      expect.objectContaining({
        applicationCode: "grading.question_worth_zero_sp",
      }),
    );
  });
});

describe("what grading guarantees", () => {
  it("GR15: every graded block names the question the manifest says it marked", () => {
    const answeredAndSkipped: Manifest = [
      ...manifest(),
      ...manifest({ blockId: "b2" }),
    ];

    const result = grade(answered(FOUR_WORDS), answeredAndSkipped);

    expect(result.gradedBlocks.map((block) => block.blockType)).toEqual([
      INPUT_FIELD_NODE_NAME,
      INPUT_FIELD_NODE_NAME,
    ]);
  });

  it("GR13: grading the same submission twice gives the same result", () => {
    const blocks = answered(HALF_RIGHT);
    const entries = manifest();

    expect(grade(blocks, entries)).toEqual(grade(blocks, entries));
  });

  it("GR13: grading changes neither the manifest nor the submission", () => {
    const blocks = answered(HALF_RIGHT);
    const entries = manifest();
    const manifestBefore = structuredClone(entries);
    const blocksBefore = structuredClone(blocks);

    grade(blocks, entries);

    expect(entries).toEqual(manifestBefore);
    expect(blocks).toEqual(blocksBefore);
  });
});
