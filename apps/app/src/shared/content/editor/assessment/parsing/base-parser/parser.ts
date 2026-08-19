import type { JSONContent } from "@tiptap/core";
import type { ZodType } from "zod";
import type { AnswerCorrectness } from "@/shared/content/contracts";

export abstract class BaseQuestionBlockParser<
  BlockType extends string,
  QuestionData,
  UserAnswer,
> {
  protected abstract readonly blockType: BlockType;

  abstract readonly questionDataStructure: ZodType<unknown>;

  abstract readonly userAnswerStructure: ZodType<unknown>;

  getBlockType(): BlockType {
    return this.blockType;
  }

  stripSolutionFromContent(
    content: JSONContent[] | undefined,
  ): JSONContent[] | undefined {
    return content;
  }

  abstract getMaxPoints(solution: QuestionData): number;

  abstract describeMissingSolution(solution: QuestionData): string | null;

  hasSolution(solution: QuestionData): boolean {
    return this.describeMissingSolution(solution) === null;
  }

  abstract isAnswered(
    learnerAnswer: UserAnswer,
    questionValidationMetadata?: QuestionData,
  ): boolean;
  abstract stripSolution(solution: QuestionData): QuestionData;
  abstract getPoints(solution: QuestionData, learnerAnswer: UserAnswer): number;

  getAnswerCorrectness(
    _solution: QuestionData,
    _learnerAnswer: UserAnswer,
  ): AnswerCorrectness | null {
    return null;
  }

  abstract formatLearnerAnswer(
    answer: UserAnswer,
    solution: QuestionData,
  ): string;
  abstract formatCorrectAnswer(solution: QuestionData): string;
}

export function countWords(text?: string | null): number {
  if (!text) return 0;
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

export function deepEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (
    !left ||
    !right ||
    typeof left !== "object" ||
    typeof right !== "object"
  ) {
    return false;
  }

  const leftEntries = Object.entries(left);
  const rightEntries = new Map<string, unknown>(Object.entries(right));
  return (
    leftEntries.length === rightEntries.size &&
    leftEntries.every(
      ([key, value]) =>
        rightEntries.has(key) && deepEqual(value, rightEntries.get(key)),
    )
  );
}

export function assertKnownParts(
  answer: Record<string, string>,
  parts: { placed: Iterable<string>; targets: Iterable<string> },
): void {
  const placed = new Set(parts.placed);
  const targets = new Set(parts.targets);
  for (const [partId, targetId] of Object.entries(answer)) {
    if (!placed.has(partId)) {
      throw new Error(
        `Answer names a part this question does not have: ${partId}`,
      );
    }
    if (targetId && !targets.has(targetId)) {
      throw new Error(
        `Answer places something this question does not have: ${targetId}`,
      );
    }
  }
}

export function countCorrectMappings(
  correctMappings: Record<string, string>,
  userAnswers: Record<string, string>,
): AnswerCorrectness {
  const entries = Object.entries(correctMappings);
  let correct = 0;
  for (const [sourceId, expectedTargetId] of entries) {
    if (userAnswers[sourceId] === expectedTargetId) correct += 1;
  }
  return { correct, total: entries.length };
}
