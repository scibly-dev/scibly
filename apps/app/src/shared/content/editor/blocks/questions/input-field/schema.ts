import { z } from "zod";

export const INPUT_FIELD_NODE_NAME = "custom-input-field";

export type QuestionData = {
  answer: string;
  caseSensitive: boolean;
};

export type UserAnswer = string;

export const defaultQuestionData: QuestionData = {
  answer: "",

  caseSensitive: true,
};

export const defaultAnswerData: UserAnswer = "";

export const userAnswerStructureSchema = z.string();

export const questionDataStructureSchema = z.strictObject({
  answer: z.string(),
  caseSensitive: z.boolean(),
});
