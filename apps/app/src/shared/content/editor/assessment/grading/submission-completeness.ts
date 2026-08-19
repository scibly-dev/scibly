import type {
  BlockSubmission,
  QuestionBlockSnapshot,
} from "@/shared/content/contracts";

import { AppError } from "@scibly/api/application-error";

import { questionBlockParserRegistry } from "@/shared/content/editor/assessment/parsing/parser-registry";

type SubmissionGaps = {
  readonly unanswered: readonly string[];

  readonly missing: readonly string[];

  readonly unexpected: readonly string[];
};

function findSubmissionGaps(
  questions: readonly QuestionBlockSnapshot[],
  blocks: readonly BlockSubmission[] | undefined,
): SubmissionGaps {
  const submitted = new Map(
    (blocks ?? []).map((block) => [block.blockId, block]),
  );
  const unanswered: string[] = [];
  const missing: string[] = [];

  for (const question of questions) {
    const block = submitted.get(question.blockId);
    if (!block) {
      missing.push(question.blockId);
      continue;
    }
    if (question.attributes.optional === true) continue;
    const isAnswered = questionBlockParserRegistry.isAnswered(
      question.blockType,
      block.learnerAnswer,
      question.attributes.questionData,
    );
    if (!isAnswered) {
      unanswered.push(question.blockId);
    }
  }

  const known = new Set(questions.map((question) => question.blockId));
  const unexpected = [...submitted.keys()].filter(
    (blockId) => !known.has(blockId),
  );

  return { unanswered, missing, unexpected };
}

/**
 * Re-checks completeness against the published scene, never the submitted
 * payload, so a client that skipped or lied about validation can't get an
 * incomplete submission stored.
 */
export function assertSubmissionComplete(
  questions: readonly QuestionBlockSnapshot[],
  blocks: readonly BlockSubmission[] | undefined,
): void {
  const gaps = findSubmissionGaps(questions, blocks);
  if (
    gaps.unanswered.length === 0 &&
    gaps.missing.length === 0 &&
    gaps.unexpected.length === 0
  ) {
    return;
  }
  throw new AppError({
    code: "BAD_REQUEST",
    applicationCode: "progression.submission_incomplete",
    message: "Answer every required question before submitting.",

    details: gaps,
  });
}
