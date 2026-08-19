import {
  assertKnownParts,
  BaseQuestionBlockParser,
} from "@/shared/content/editor/assessment/parsing/base-parser/parser";
import {
  CLOZE_TEXT_NODE_NAME,
  getGapSegments,
  type QuestionData,
  questionDataStructureSchema,
  type UserAnswer,
  userAnswerStructureSchema,
} from "@/shared/content/editor/blocks/questions/cloze-text/schema";

export class ClozeTextParser extends BaseQuestionBlockParser<
  typeof CLOZE_TEXT_NODE_NAME,
  QuestionData,
  UserAnswer
> {
  readonly questionDataStructure = questionDataStructureSchema;
  readonly userAnswerStructure = userAnswerStructureSchema;
  protected readonly blockType = CLOZE_TEXT_NODE_NAME;

  getAnswerCorrectness(solution: QuestionData, learnerAnswer: UserAnswer) {
    const gaps = getGapSegments(solution.segments);
    if (gaps.length === 0) return null;
    return {
      correct: gaps.filter((gap) => learnerAnswer[gap.id] === gap.correctItemId)
        .length,
      total: gaps.length,
    };
  }

  getPoints(solution: QuestionData, learnerAnswer: UserAnswer): number {
    const gaps = getGapSegments(solution.segments);
    assertKnownParts(learnerAnswer, {
      placed: gaps.map((gap) => gap.id),
      targets: solution.items.map((item) => item.id),
    });

    return gaps.filter((gap) => learnerAnswer[gap.id] === gap.correctItemId)
      .length;
  }

  describeMissingSolution(solution: QuestionData): string | null {
    const gaps = getGapSegments(solution.segments);
    if (gaps.length === 0) return "This text has no gaps for a learner to fill";

    const wordIds = new Set(solution.items.map((item) => item.id));
    for (const [index, gap] of gaps.entries()) {
      const position = index + 1;
      if (!gap.correctItemId) return `Gap ${position} has no correct word`;
      if (!wordIds.has(gap.correctItemId)) {
        return `Gap ${position}'s correct word is no longer in the word bank`;
      }
    }
    return null;
  }

  isAnswered(
    learnerAnswer: UserAnswer,
    questionValidationMetadata?: QuestionData,
  ): boolean {
    const answers = learnerAnswer ?? {};
    const gaps = questionValidationMetadata
      ? getGapSegments(questionValidationMetadata.segments)
      : [];
    return gaps.length === 0
      ? Object.keys(answers).length > 0
      : gaps.every((gap) => Boolean(answers[gap.id]));
  }

  getMaxPoints(solution: QuestionData): number {
    return getGapSegments(solution.segments).length;
  }

  stripSolution(solution: QuestionData): QuestionData {
    return {
      ...solution,
      segments: solution.segments.map((segment) =>
        segment.type === "gap" ? { ...segment, correctItemId: "" } : segment,
      ),
    };
  }

  formatLearnerAnswer(
    learnerAnswer: UserAnswer,
    solution: QuestionData,
  ): string {
    if (!learnerAnswer || typeof learnerAnswer !== "object") return "(empty)";
    const formatted = getGapSegments(solution.segments).flatMap(
      (gap, index) => {
        const itemId = learnerAnswer[gap.id];
        if (!itemId) return [];
        const label =
          solution.items.find((item) => item.id === itemId)?.label ?? itemId;
        return [`#${index + 1}: ${label}`];
      },
    );
    return formatted.length > 0 ? formatted.join(", ") : "(empty)";
  }

  formatCorrectAnswer(solution: QuestionData): string {
    const formatted = getGapSegments(solution.segments).map((gap, index) => {
      const label =
        solution.items.find((item) => item.id === gap.correctItemId)?.label ??
        gap.correctItemId;
      return `#${index + 1}: ${label}`;
    });
    return formatted.length > 0 ? formatted.join(", ") : "(empty)";
  }
}
