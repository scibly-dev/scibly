import { z } from "zod";

export const MULTIPLE_CHOICE_NODE_NAME = "custom-multiple-choice";

export type Choice = {
  id: string;
  text: string;
};

export type QuestionData = {
  choices: Choice[];
  correctChoiceIds: string[];
  allowMultiple: boolean;
};

export type UserAnswer = string[];

export const defaultQuestionData: QuestionData = {
  choices: [
    { id: "1", text: "Option 1" },
    { id: "2", text: "Option 2" },
  ],
  correctChoiceIds: ["1"],
  allowMultiple: false,
};

export const defaultAnswerData: UserAnswer = [];

export const questionDataStructureSchema = z.strictObject({
  choices: z.array(z.strictObject({ id: z.string(), text: z.string() })),
  correctChoiceIds: z.array(z.string()),
  allowMultiple: z.boolean(),
});

export const userAnswerStructureSchema = z.array(z.string());

const choiceSchema = z.object({
  id: z.string(),
  text: z.string().trim().min(1, "Option text cannot be empty"),
});

const choicesSchema = z
  .array(choiceSchema)
  .min(2, "At least 2 options are required")
  .refine(
    (choices) => {
      const texts = choices.map((c) => c.text.trim());
      return new Set(texts).size === texts.length;
    },
    { message: "Options must be unique" },
  );

export const validateChoices = (choices: Choice[]) => {
  return choicesSchema.safeParse(choices);
};

export const getDuplicateChoiceIds = (choices: Choice[]): string[] => {
  const duplicates = new Set<string>();
  const seen = new Map<string, string>();
  for (const choice of choices) {
    const text = choice.text.trim();
    if (!text) continue;
    if (seen.has(text)) {
      duplicates.add(choice.id);
      duplicates.add(seen.get(text)!);
    } else {
      seen.set(text, choice.id);
    }
  }
  return Array.from(duplicates);
};
