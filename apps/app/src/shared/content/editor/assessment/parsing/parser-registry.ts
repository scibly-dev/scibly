import type { JSONContent } from "@tiptap/core";
import type { BaseQuestionBlockParser } from "@/shared/content/editor/assessment/parsing/base-parser/parser";
import type { QuestionBlocksType } from "@/shared/content/editor/blocks/registry/shared";

import { editorSchemaRegistry } from "@/shared/content/editor/blocks/registry/shared";

type RegisteredParser = ReturnType<
  (typeof editorSchemaRegistry)["getQuestionDefinitions"]
>[number]["parser"];

class QuestionBlockParserRegistry {
  private readonly parsers = new Map<QuestionBlocksType, RegisteredParser>();

  constructor() {
    for (const { parser } of editorSchemaRegistry.getQuestionDefinitions()) {
      this.parsers.set(parser.getBlockType(), parser);
    }
  }

  getParser<BlockType extends QuestionBlocksType, QuestionData, UserAnswer>(
    blockType: BlockType,
  ): BaseQuestionBlockParser<BlockType, QuestionData, UserAnswer> {
    const parser = this.parsers.get(blockType);
    if (!parser) {
      throw new Error(`No parser found for block type: ${blockType}`);
    }
    // SAFETY: `QuestionData` and `UserAnswer` are named by the caller, not

    // eslint-disable-next-line anti-slop/no-chained-type-assertions -- see above
    return parser as unknown as BaseQuestionBlockParser<
      BlockType,
      QuestionData,
      UserAnswer
    >;
  }

  isAnswered<BlockType extends QuestionBlocksType, QuestionData, UserAnswer>(
    blockType: BlockType,
    learnerAnswer: UserAnswer,
    questionValidationMetadata?: QuestionData,
  ): boolean {
    return this.getParser<BlockType, QuestionData, UserAnswer>(
      blockType,
    ).isAnswered(learnerAnswer, questionValidationMetadata);
  }

  hasSolution<BlockType extends QuestionBlocksType, QuestionData, UserAnswer>(
    blockType: BlockType,
    solution: QuestionData,
  ): boolean {
    return this.getParser<BlockType, QuestionData, UserAnswer>(
      blockType,
    ).hasSolution(solution);
  }

  describeMissingSolution<
    BlockType extends QuestionBlocksType,
    QuestionData,
    UserAnswer,
  >(blockType: BlockType, solution: QuestionData): string | null {
    return this.getParser<BlockType, QuestionData, UserAnswer>(
      blockType,
    ).describeMissingSolution(solution);
  }

  getMaxPoints<BlockType extends QuestionBlocksType, QuestionData, UserAnswer>(
    blockType: BlockType,
    solution: QuestionData,
  ): number {
    return this.getParser<BlockType, QuestionData, UserAnswer>(
      blockType,
    ).getMaxPoints(solution);
  }

  stripSolution<BlockType extends QuestionBlocksType, QuestionData, UserAnswer>(
    blockType: BlockType,
    solution: QuestionData,
  ): QuestionData {
    return this.getParser<BlockType, QuestionData, UserAnswer>(
      blockType,
    ).stripSolution(solution);
  }

  assertQuestionDataStructure(
    blockType: QuestionBlocksType,
    questionData: unknown,
  ): void {
    const result =
      this.getParser(blockType).questionDataStructure.safeParse(questionData);
    if (!result.success) {
      throw new Error(
        `Question data for block type "${blockType}" is not publishable: ${result.error.issues
          .map(
            (issue) => `${issue.path.join(".") || "(root)"} ${issue.message}`,
          )
          .join("; ")}`,
      );
    }
  }

  stripSolutionFromContent(
    blockType: QuestionBlocksType,
    content: JSONContent[] | undefined,
  ): JSONContent[] | undefined {
    return this.getParser(blockType).stripSolutionFromContent(content);
  }

  assertUserAnswerStructure(
    blockType: QuestionBlocksType,
    learnerAnswer: unknown,
  ): void {
    const result =
      this.getParser(blockType).userAnswerStructure.safeParse(learnerAnswer);
    if (!result.success) {
      throw new Error(
        `Answer for block type "${blockType}" is not markable: ${result.error.issues
          .map(
            (issue) => `${issue.path.join(".") || "(root)"} ${issue.message}`,
          )
          .join("; ")}`,
      );
    }
  }

  getPoints<BlockType extends QuestionBlocksType, QuestionData, UserAnswer>(
    blockType: BlockType,
    solution: QuestionData,
    learnerAnswer: UserAnswer,
  ): number {
    this.assertUserAnswerStructure(blockType, learnerAnswer);
    return this.getParser<BlockType, QuestionData, UserAnswer>(
      blockType,
    ).getPoints(solution, learnerAnswer);
  }

  getAnswerCorrectness<
    BlockType extends QuestionBlocksType,
    QuestionData,
    UserAnswer,
  >(blockType: BlockType, solution: QuestionData, learnerAnswer: UserAnswer) {
    return this.getParser<BlockType, QuestionData, UserAnswer>(
      blockType,
    ).getAnswerCorrectness(solution, learnerAnswer);
  }

  hasParser(blockType: string): boolean {
    // SAFETY: `Map.has` only asks whether the key is present, and a string

    return this.parsers.has(blockType as QuestionBlocksType);
  }

  formatLearnerAnswer(
    blockType: QuestionBlocksType,
    learnerAnswer: unknown,
    questionData?: unknown,
  ): string {
    return this.getParser<QuestionBlocksType, unknown, unknown>(
      blockType,
    ).formatLearnerAnswer(learnerAnswer, questionData);
  }

  formatCorrectAnswer(
    blockType: QuestionBlocksType,
    questionData?: unknown,
  ): string {
    if (!questionData) return "";
    return this.getParser<QuestionBlocksType, unknown, unknown>(
      blockType,
    ).formatCorrectAnswer(questionData);
  }
}

export const questionBlockParserRegistry = new QuestionBlockParserRegistry();
