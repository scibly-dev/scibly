import { z } from "zod";

export const FREE_FORM_INPUT_NODE_NAME = "custom-free-form-input";

export type QuestionData = {
  minLength?: number;
  maxLength?: number;
};

export type UserAnswer = string;

export const defaultQuestionData: QuestionData = {
  minLength: undefined,
  maxLength: 200,
};

export const defaultAnswerData: UserAnswer = "";

export const userAnswerStructureSchema = z.string();

export const questionDataStructureSchema = z.strictObject({
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
});
