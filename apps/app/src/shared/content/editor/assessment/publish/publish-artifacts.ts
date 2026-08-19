import type {
  LearnerQuestionBlock,
  PublishArtifacts,
  QuestionBlockAttributes,
  QuestionBlockSnapshot,
} from "@/shared/content/contracts";

import { questionBlockParserRegistry } from "@/shared/content/editor/assessment/parsing/parser-registry";
import { DEFAULT_QUESTION_BLOCK_SP } from "@/shared/content/editor/blocks/attributes/default-question-block-attributes";

type GradingManifest = PublishArtifacts["gradingManifest"];

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}

function cloneAttributes(
  attributes: Readonly<QuestionBlockAttributes>,
): QuestionBlockAttributes {
  return structuredClone(attributes);
}

export function buildGradingManifest(
  blocks: readonly QuestionBlockSnapshot[],
): GradingManifest {
  return Object.freeze(
    blocks.map((block) =>
      Object.freeze({
        blockId: block.blockId,
        blockType: block.blockType,
        questionData: deepFreeze(
          structuredClone(block.attributes.questionData),
        ),
        maxPoints: block.attributes.maxPoints,
        sp: block.attributes.sp ?? DEFAULT_QUESTION_BLOCK_SP,
      }),
    ),
  );
}

export function buildPublishArtifacts(
  blocks: readonly QuestionBlockSnapshot[],
): PublishArtifacts {
  const learnerDocument: LearnerQuestionBlock[] = blocks.map((block) => {
    const attributes = cloneAttributes(block.attributes);
    delete attributes.userAnswers;
    delete attributes.achievedPoints;

    questionBlockParserRegistry.assertQuestionDataStructure(
      block.blockType,
      attributes.questionData,
    );
    attributes.questionData = questionBlockParserRegistry.stripSolution(
      block.blockType,
      attributes.questionData,
    );

    return Object.freeze({
      blockId: block.blockId,
      attributes: deepFreeze(attributes),
    });
  });

  return Object.freeze({
    learnerDocument: Object.freeze(learnerDocument),
    gradingManifest: buildGradingManifest(blocks),
  });
}
