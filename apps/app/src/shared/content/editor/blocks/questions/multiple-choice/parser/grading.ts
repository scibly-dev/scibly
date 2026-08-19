import { BaseQuestionBlockParser } from "@/shared/content/editor/assessment/parsing/base-parser/parser";
import {
  MULTIPLE_CHOICE_NODE_NAME,
  type QuestionData,
  questionDataStructureSchema,
  type UserAnswer,
  userAnswerStructureSchema,
} from "@/shared/content/editor/blocks/questions/multiple-choice/schema";

export class MultipleChoiceParser extends BaseQuestionBlockParser<
  typeof MULTIPLE_CHOICE_NODE_NAME,
  QuestionData,
  UserAnswer
> {
  readonly questionDataStructure = questionDataStructureSchema;
  readonly userAnswerStructure = userAnswerStructureSchema;
  protected readonly blockType = MULTIPLE_CHOICE_NODE_NAME;
  protected readonly POINTS_PER_CORRECT_CHOICE = 1;

  getAnswerCorrectness(solution: QuestionData, learnerAnswer: UserAnswer) {
    const correctIds = solution.correctChoiceIds;
    if (correctIds.length === 0) return null;
    if (!solution.allowMultiple) {
      const isCorrect =
        learnerAnswer.length === 1 &&
        correctIds.includes(learnerAnswer[0] ?? "");
      return { correct: isCorrect ? 1 : 0, total: 1 };
    }
    return {
      correct: learnerAnswer.filter((id) => correctIds.includes(id)).length,
      total: correctIds.length,
    };
  }

  getPoints(solution: QuestionData, learnerAnswer: UserAnswer): number {
    const choiceIds = new Set(solution.choices.map((choice) => choice.id));
    for (const selectedId of learnerAnswer) {
      if (!choiceIds.has(selectedId)) {
        throw new Error(
          `Answer names a choice this question does not have: ${selectedId}`,
        );
      }
    }

    if (!solution.allowMultiple) {
      return learnerAnswer.length === 1 &&
        solution.correctChoiceIds.includes(learnerAnswer[0] ?? "")
        ? this.POINTS_PER_CORRECT_CHOICE
        : 0;
    }
    let points = 0;
    for (const selectedId of learnerAnswer) {
      points += solution.correctChoiceIds.includes(selectedId) ? 1 : -1;
    }
    return Math.max(0, points);
  }

  describeMissingSolution(solution: QuestionData): string | null {
    if (solution.correctChoiceIds.length === 0) {
      return "No option is marked as the correct answer";
    }

    const choiceIds = new Set(solution.choices.map((choice) => choice.id));
    if (solution.correctChoiceIds.some((id) => !choiceIds.has(id))) {
      return "An option marked as correct is no longer one of the options";
    }
    return null;
  }

  isAnswered(learnerAnswer: UserAnswer): boolean {
    return Boolean(learnerAnswer?.length);
  }

  getMaxPoints(solution: QuestionData): number {
    return solution.allowMultiple
      ? solution.correctChoiceIds.length * this.POINTS_PER_CORRECT_CHOICE
      : this.POINTS_PER_CORRECT_CHOICE;
  }

  stripSolution(solution: QuestionData) {
    return { ...solution, correctChoiceIds: [] };
  }

  formatLearnerAnswer(
    learnerAnswer: UserAnswer,
    solution: QuestionData,
  ): string {
    if (!Array.isArray(learnerAnswer)) return "(empty)";
    const texts = learnerAnswer.flatMap((id) => {
      const text = solution.choices?.find((choice) => choice.id === id)?.text;
      return text?.trim() ? [text.trim()] : id ? [String(id)] : [];
    });
    return texts.length > 0 ? texts.join(", ") : "(empty)";
  }

  formatCorrectAnswer(solution: QuestionData): string {
    return this.formatLearnerAnswer(solution.correctChoiceIds, solution);
  }
}
