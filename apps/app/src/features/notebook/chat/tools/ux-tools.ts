import { z } from "zod";

// No id field — ids are React keys/selection handles nothing outside the browser
// reads, so `parseAskMultipleChoiceInput` assigns them instead of giving the model an omittable field.
const multipleChoiceOptionInputSchema = z.object({
  label: z
    .string()
    .min(1)
    .describe("Short label shown on the clickable option"),
});

const multipleChoiceQuestionInputSchema = z.object({
  question: z.string().min(1),
  options: z.array(multipleChoiceOptionInputSchema).min(2).max(8),
  allowMultiple: z.boolean().optional(),
});

const multipleChoiceAnswerSchema = z.object({
  questionId: z.string().optional(),
  selectedOptionIds: z.array(z.string()),
  selectedLabels: z.array(z.string()),
  customAnswer: z.string().optional(),
  skipped: z.boolean().optional(),
});

export const askMultipleChoiceInputSchema = z.object({
  question: z
    .string()
    .min(1)
    .optional()
    .describe("One-question shorthand: the question shown above the options"),
  options: z
    .array(multipleChoiceOptionInputSchema)
    .min(2)
    .max(8)
    .optional()
    .describe("One-question shorthand: clickable choices"),
  allowMultiple: z
    .boolean()
    .optional()
    .describe(
      "When true, the user can select multiple options before confirming",
    ),
  questions: z
    .array(multipleChoiceQuestionInputSchema)
    .min(1)
    .max(8)
    .optional()
    .describe(
      "Ask 1–8 questions back-to-back in one wizard before continuing. " +
        "Prefer this at the start of course creation instead of many separate tool calls.",
    ),
});

export const INVALID_TOOL_INPUT = "invalid_tool_input" as const;

export const askMultipleChoiceOutputSchema = z.object({
  selectedOptionIds: z.array(z.string()).optional(),
  selectedLabels: z.array(z.string()).optional(),
  customAnswer: z.string().optional(),
  skipped: z.boolean().optional(),
  answers: z.array(multipleChoiceAnswerSchema).optional(),
  error: z
    .literal(INVALID_TOOL_INPUT)
    .optional()
    .describe("Set when the question could not be shown; ask it again"),
});

export type AskMultipleChoiceOutput = z.infer<
  typeof askMultipleChoiceOutputSchema
>;
export type MultipleChoiceAnswer = z.infer<typeof multipleChoiceAnswerSchema>;

export interface MultipleChoiceOption {
  id: string;
  label: string;
}

export interface MultipleChoiceQuestionStep {
  id: string;
  question: string;
  options: MultipleChoiceOption[];
  allowMultiple?: boolean;
}

export interface ParsedAskMultipleChoiceInput {
  questions: MultipleChoiceQuestionStep[];
}

// Collapses both input shapes (single-question shorthand and the `questions`
// array) into one list, so the renderer never has to know which the model used.
export function parseAskMultipleChoiceInput(
  input: unknown,
): ParsedAskMultipleChoiceInput | null {
  const result = askMultipleChoiceInputSchema.safeParse(input);
  if (!result.success) return null;
  const { question, options, allowMultiple, questions } = result.data;

  const asked = questions?.length
    ? questions
    : question?.trim() && options?.length
      ? [{ question, options, allowMultiple }]
      : [];

  if (!asked.length) return null;

  return {
    questions: asked.map((entry, questionIndex) => ({
      id: `q-${questionIndex}`,
      question: entry.question.trim(),

      options: entry.options.map((option, optionIndex) => ({
        id: `q${questionIndex}-opt-${optionIndex}`,
        label: option.label.trim(),
      })),
      allowMultiple: entry.allowMultiple,
    })),
  };
}

const planStepInputSchema = z.object({
  title: z.string().min(1).describe("Short step headline"),
  detail: z
    .string()
    .optional()
    .describe("Optional supporting detail shown under the step title"),
});

const planStepSchema = planStepInputSchema.extend({
  id: z.string().min(1),
});

export const proposePlanInputSchema = z.object({
  title: z
    .string()
    .min(1)
    .describe("Plan headline, e.g. 'Proposed course structure'"),
  summary: z
    .string()
    .optional()
    .describe("Brief context or goal for this plan"),
  steps: z
    .array(planStepInputSchema)
    .min(1)
    .max(20)
    .describe("Ordered steps the agent intends to take"),
});

export interface ParsedProposePlanInput {
  title: string;
  summary?: string;
  steps: PlanStep[];
}

export function parseProposePlanInput(
  input: unknown,
): ParsedProposePlanInput | null {
  const result = proposePlanInputSchema.safeParse(input);
  if (!result.success) return null;

  const title = result.data.title.trim();
  const steps = result.data.steps
    .filter((step) => step.title.trim())
    .map((step, index) => ({
      id: `step-${index}`,
      title: step.title.trim(),
      detail: step.detail?.trim() || undefined,
    }));

  if (!title || !steps.length) return null;

  return { title, summary: result.data.summary?.trim() || undefined, steps };
}

const planDecisions = ["confirmed", "denied", "adjusted"] as const;

export const proposePlanOutputSchema = z
  .object({
    decision: z.enum(planDecisions).optional(),
    feedback: z
      .string()
      .optional()
      .describe("User notes when denying or adjusting the plan"),
    steps: z
      .array(planStepSchema)
      .min(1)
      .max(20)
      .optional()
      .describe("Final agreed steps when confirmed or adjusted"),
    error: z
      .literal(INVALID_TOOL_INPUT)
      .optional()
      .describe("Set when the plan could not be shown; propose it again"),
  })
  .refine((value) => Boolean(value.decision) !== Boolean(value.error), {
    message: "Provide either a decision or an error, not both.",
  });

export type PlanStep = z.infer<typeof planStepSchema>;
export type PlanDecision = (typeof planDecisions)[number];
export type ProposePlanOutput = z.infer<typeof proposePlanOutputSchema>;
