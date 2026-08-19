import { BaseQuestionBlockParser } from "@/shared/content/editor/assessment/parsing/base-parser/parser";
import {
  type QuestionData,
  questionDataStructureSchema,
  STEPS_NODE_NAME,
  type UserAnswer,
  userAnswerStructureSchema,
} from "@/shared/content/editor/blocks/steps/schema";

export class StepsParser extends BaseQuestionBlockParser<
  typeof STEPS_NODE_NAME,
  QuestionData,
  UserAnswer
> {
  readonly questionDataStructure = questionDataStructureSchema;
  readonly userAnswerStructure = userAnswerStructureSchema;
  protected readonly blockType = STEPS_NODE_NAME;

  getPoints(solution: QuestionData, learnerAnswer: UserAnswer): number {
    return this.isAnswered(learnerAnswer, solution) ? 1 : 0;
  }

  describeMissingSolution(solution: QuestionData): string | null {
    if (solution.stepCount === 0) return "The block has no steps yet";
    if (solution.firstEmptyStep !== null) {
      return `Step ${solution.firstEmptyStep} is empty`;
    }
    return null;
  }

  isAnswered(
    learnerAnswer: UserAnswer,
    questionValidationMetadata?: QuestionData,
  ): boolean {
    const stepCount = questionValidationMetadata?.stepCount ?? 0;
    if (stepCount === 0) return false;
    return typeof learnerAnswer === "number" && learnerAnswer >= stepCount;
  }

  getMaxPoints(): number {
    return 1;
  }

  stripSolution(solution: QuestionData): QuestionData {
    return solution;
  }

  formatLearnerAnswer(
    learnerAnswer: UserAnswer,
    solution: QuestionData,
  ): string {
    const opened = typeof learnerAnswer === "number" ? learnerAnswer : 0;
    return `${opened} of ${solution.stepCount} steps opened`;
  }

  formatCorrectAnswer(solution: QuestionData): string {
    return `All ${solution.stepCount} steps opened`;
  }
}
