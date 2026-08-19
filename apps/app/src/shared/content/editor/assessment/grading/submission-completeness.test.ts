import type {
  BlockSubmission,
  QuestionBlockSnapshot,
} from "@/shared/content/contracts";

import { AppError } from "@scibly/api/application-error";
import { describe, expect, it } from "vitest";

import { FREE_FORM_INPUT_NODE_NAME } from "@/shared/content/editor/blocks/questions/free-form-input/schema";
import { INPUT_FIELD_NODE_NAME } from "@/shared/content/editor/blocks/questions/input-field/schema";

import { assertSubmissionComplete } from "./submission-completeness";

const QUESTION = { answer: "Paris", caseSensitive: false };

function question(
  blockId: string,
  attributes: QuestionBlockSnapshot["attributes"] = {},
): QuestionBlockSnapshot {
  return {
    blockId,
    blockType: INPUT_FIELD_NODE_NAME,
    attributes: { questionData: QUESTION, ...attributes },
  };
}

function submitted(blockId: string, learnerAnswer: unknown): BlockSubmission {
  return { blockId, blockType: INPUT_FIELD_NODE_NAME, learnerAnswer };
}

function reject(
  questions: readonly QuestionBlockSnapshot[],
  blocks: BlockSubmission[] | undefined,
): AppError | null {
  try {
    assertSubmissionComplete(questions, blocks);
    return null;
  } catch (error) {
    if (error instanceof AppError) return error;
    throw error;
  }
}

describe("the server gate", () => {
  it("ANS10: a submission answering every question is accepted", () => {
    expect(
      reject(
        [question("b1"), question("b2")],
        [submitted("b1", "Paris"), submitted("b2", "Lisbon")],
      ),
    ).toBeNull();
  });

  it("ANS10: a submission leaving a question blank is rejected", () => {
    const rejection = reject([question("b1")], [submitted("b1", "")]);

    expect(rejection).toBeInstanceOf(AppError);
    expect(rejection?.code).toBe("BAD_REQUEST");
  });

  it("ANS10: whitespace is refused on the server too, not only in the browser", () => {
    expect(reject([question("b1")], [submitted("b1", "   ")])).toBeInstanceOf(
      AppError,
    );
  });

  it("ANS9: a scene with no questions accepts a submission with no blocks", () => {
    expect(reject([], [])).toBeNull();
    expect(reject([], undefined)).toBeNull();
  });

  it("ANS6: an optional question left blank does not block the submission", () => {
    expect(
      reject([question("b1", { optional: true })], [submitted("b1", "")]),
    ).toBeNull();
  });

  it("ANS14: optional is read from the published scene, never from the submission", () => {
    const payload = [submitted("b1", "")];

    expect(reject([question("b1", { optional: true })], payload)).toBeNull();
    expect(reject([question("b1")], payload)).toBeInstanceOf(AppError);
  });

  it("ANS14: the question's type comes from the scene, not from the payload", () => {
    const scene = [question("b1")];
    const claimsAnotherType: BlockSubmission = {
      blockId: "b1",
      blockType: FREE_FORM_INPUT_NODE_NAME,
      learnerAnswer: "",
    };

    expect(reject(scene, [claimsAnotherType])).toBeInstanceOf(AppError);
  });

  it("ANS16: a question that can earn no points still has to be answered", () => {
    const unmarked = question("b1", {
      questionData: { answer: "", caseSensitive: true },
      maxPoints: 0,
    });

    expect(reject([unmarked], [submitted("b1", "")])).toBeInstanceOf(AppError);
    expect(
      reject([unmarked], [submitted("b1", "I found it unfair.")]),
    ).toBeNull();
  });

  it("ANS12: a submission that omits one of the scene's questions is rejected", () => {
    const rejection = reject(
      [question("b1"), question("b2")],
      [submitted("b1", "Paris")],
    );

    expect(rejection).toBeInstanceOf(AppError);
    expect(rejection?.details).toMatchObject({ missing: ["b2"] });
  });

  it("ANS12: a submission with no blocks at all is rejected when the scene asks something", () => {
    expect(reject([question("b1")], [])).toBeInstanceOf(AppError);
    expect(reject([question("b1")], undefined)).toBeInstanceOf(AppError);
  });

  it("ANS12: an omitted optional question is still an omission", () => {
    expect(reject([question("b1", { optional: true })], [])).toBeInstanceOf(
      AppError,
    );
  });

  it("ANS13: a submission carrying a block the scene does not have is rejected", () => {
    const rejection = reject(
      [question("b1")],
      [submitted("b1", "Paris"), submitted("ghost", "Paris")],
    );

    expect(rejection).toBeInstanceOf(AppError);
    expect(rejection?.details).toMatchObject({ unexpected: ["ghost"] });
  });

  it("ANS11: the rejection names every question at fault", () => {
    const rejection = reject(
      [question("b1"), question("b2"), question("b3")],
      [submitted("b1", ""), submitted("b3", "Paris"), submitted("ghost", "x")],
    );

    expect(rejection?.details).toEqual({
      unanswered: ["b1"],
      missing: ["b2"],
      unexpected: ["ghost"],
    });
  });

  it("ANS17: an answer that never arrived is rejected, not a crash", () => {
    expect(reject([question("b1")], [submitted("b1", null)])).toBeInstanceOf(
      AppError,
    );
    expect(
      reject([question("b1")], [submitted("b1", undefined)]),
    ).toBeInstanceOf(AppError);
  });
});
