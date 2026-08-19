import { z } from "zod";

export const STEPS_NODE_NAME = "steps";
export const STEP_NODE_NAME = "step";

export type QuestionData = {
  stepCount: number;

  firstEmptyStep: number | null;
};

export type UserAnswer = number;

export const defaultQuestionData: QuestionData = {
  stepCount: 0,
  firstEmptyStep: null,
};

export const defaultAnswerData: UserAnswer = 0;

export const userAnswerStructureSchema = z.number().int().min(0);

export const questionDataStructureSchema = z.strictObject({
  stepCount: z.number().int().min(0),
  firstEmptyStep: z.number().int().min(1).nullable(),
});
