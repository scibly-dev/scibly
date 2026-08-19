import {
  BaseQuestionBlockParser,
  countWords,
} from "@/shared/content/editor/assessment/parsing/base-parser/parser";
import {
  INPUT_FIELD_NODE_NAME,
  type QuestionData,
  questionDataStructureSchema,
  type UserAnswer,
  userAnswerStructureSchema,
} from "@/shared/content/editor/blocks/questions/input-field/schema";

export class InputFieldParser extends BaseQuestionBlockParser<
  typeof INPUT_FIELD_NODE_NAME,
  QuestionData,
  UserAnswer
> {
  readonly POINTS_PER_WORD = 0.25;
  readonly PLACEHOLDER = "X";
  readonly questionDataStructure = questionDataStructureSchema;
  readonly userAnswerStructure = userAnswerStructureSchema;
  protected readonly blockType = INPUT_FIELD_NODE_NAME;

  getPoints(solution: QuestionData, learnerAnswer: UserAnswer): number {
    let solStr = solution.answer;
    let ansStr = learnerAnswer;
    if (!solution.caseSensitive) {
      solStr = solStr.toLowerCase();
      ansStr = ansStr.toLowerCase();
    }
    const solutionWords = solStr.trim().split(/\s+/).filter(Boolean);
    const answerWords = ansStr.trim().split(/\s+/).filter(Boolean);
    let correctWordCount = 0;
    for (
      let index = 0;
      index < Math.min(solutionWords.length, answerWords.length);
      index++
    ) {
      if (solutionWords[index] === answerWords[index]) correctWordCount++;
    }
    return this.POINTS_PER_WORD * correctWordCount;
  }

  describeMissingSolution(solution: QuestionData): string | null {
    return solution.answer.trim() === ""
      ? "No correct answer has been written"
      : null;
  }

  isAnswered(learnerAnswer: UserAnswer): boolean {
    return typeof learnerAnswer === "string" && learnerAnswer.trim() !== "";
  }

  getMaxPoints(solution: QuestionData): number {
    return this.POINTS_PER_WORD * countWords(solution.answer);
  }

  stripSolution(solution: QuestionData): QuestionData {
    return {
      ...solution,
      answer: Array(countWords(solution.answer))
        .fill(this.PLACEHOLDER)
        .join(" "),
    };
  }

  formatLearnerAnswer(learnerAnswer: UserAnswer): string {
    return typeof learnerAnswer === "string"
      ? learnerAnswer.trim() || "(empty)"
      : String(learnerAnswer);
  }

  formatCorrectAnswer(solution: QuestionData): string {
    return this.formatLearnerAnswer(solution.answer);
  }
}
