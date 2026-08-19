import { BaseQuestionBlockParser } from "@/shared/content/editor/assessment/parsing/base-parser/parser";
import {
  FREE_FORM_INPUT_NODE_NAME,
  type QuestionData,
  questionDataStructureSchema,
  type UserAnswer,
  userAnswerStructureSchema,
} from "@/shared/content/editor/blocks/questions/free-form-input/schema";

export class FreeFormInputParser extends BaseQuestionBlockParser<
  typeof FREE_FORM_INPUT_NODE_NAME,
  QuestionData,
  UserAnswer
> {
  readonly questionDataStructure = questionDataStructureSchema;
  readonly userAnswerStructure = userAnswerStructureSchema;
  protected readonly blockType = FREE_FORM_INPUT_NODE_NAME;

  getPoints(solution: QuestionData, learnerAnswer: UserAnswer): number {
    return this.isAnswered(learnerAnswer, solution) ? 1 : 0;
  }

  describeMissingSolution(): string | null {
    return null;
  }

  isAnswered(
    learnerAnswer: UserAnswer,
    questionValidationMetadata?: QuestionData,
  ): boolean {
    if (typeof learnerAnswer !== "string") return false;
    const length = learnerAnswer.trim().length;
    if (length === 0) return false;
    return !(
      questionValidationMetadata?.minLength !== undefined &&
      length < questionValidationMetadata.minLength
    );
  }

  getMaxPoints(): number {
    return 1;
  }

  stripSolution(solution: QuestionData): QuestionData {
    return solution;
  }

  formatLearnerAnswer(learnerAnswer: UserAnswer): string {
    return typeof learnerAnswer === "string"
      ? learnerAnswer.trim() || "(empty)"
      : String(learnerAnswer);
  }

  formatCorrectAnswer(): string {
    return "(Open-ended response)";
  }
}
