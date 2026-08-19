import { z } from "zod";

export const CLOZE_TEXT_NODE_NAME = "custom-cloze-text";

export type WordItem = {
  id: string;
  label: string;
};

export type TextSegment = {
  type: "text";
  id: string;
  content: string;
};

export type GapSegment = {
  type: "gap";
  id: string;
  correctItemId: string;
};

export type ClozeSegment = TextSegment | GapSegment;

export type QuestionData = {
  segments: ClozeSegment[];
  items: WordItem[];
};

export type UserAnswer = Record<string, string>;

export const defaultQuestionData: QuestionData = {
  segments: [{ type: "text", id: "seg-1", content: "" }],
  items: [],
};

export const clozeAiSchemaExample: QuestionData = {
  segments: [
    { type: "text", id: "seg-1", content: "The " },
    { type: "gap", id: "gap-1", correctItemId: "item-1" },
    { type: "text", id: "seg-2", content: " rises." },
  ],
  items: [
    { id: "item-1", label: "sun" },
    { id: "item-2", label: "moon" },
  ],
};

export const defaultAnswerData: UserAnswer = {};

const wordItemSchema = z.object({
  id: z.string(),
  label: z.string().trim().min(1, "Word label cannot be empty"),
});

const textSegmentSchema = z.object({
  type: z.literal("text"),
  id: z.string(),
  content: z.string(),
});

const gapSegmentSchema = z.object({
  type: z.literal("gap"),
  id: z.string(),
  correctItemId: z.string(),
});

export const userAnswerStructureSchema = z.record(z.string(), z.string());

export const questionDataStructureSchema = z.strictObject({
  segments: z.array(
    z.discriminatedUnion("type", [
      z.strictObject({
        type: z.literal("text"),
        id: z.string(),
        content: z.string(),
      }),
      z.strictObject({
        type: z.literal("gap"),
        id: z.string(),
        correctItemId: z.string(),
      }),
    ]),
  ),
  items: z.array(z.strictObject({ id: z.string(), label: z.string() })),
});

const clozeTextStructureSchema = z.object({
  segments: z
    .array(z.discriminatedUnion("type", [textSegmentSchema, gapSegmentSchema]))
    .min(1, "At least one segment is required"),
  items: z.array(wordItemSchema),
});

const clozeTextSchema = clozeTextStructureSchema.superRefine((data, ctx) => {
  const gaps = data.segments.filter(
    (segment): segment is GapSegment => segment.type === "gap",
  );

  if (gaps.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "At least one gap is required",
      path: ["segments"],
    });
  }

  const itemIds = new Set(data.items.map((item) => item.id));

  for (const gap of gaps) {
    if (!itemIds.has(gap.correctItemId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Gap references an unknown word",
        path: ["segments"],
      });
    }
  }
});

// Learner content omits each gap's correctItemId, so a structurally valid cloze with empty ids counts as non-empty rather than invalid.
export function isClozeTextEmpty(questionData: unknown): boolean {
  const result = clozeTextStructureSchema.safeParse(questionData);
  if (!result.success) return true;

  const gaps = result.data.segments.filter(
    (segment): segment is GapSegment => segment.type === "gap",
  );
  if (gaps.length === 0) return true;

  const isPublishedLearnerContent = gaps.every(
    (gap) => gap.correctItemId === "",
  );
  return (
    !isPublishedLearnerContent &&
    !clozeTextSchema.safeParse(result.data).success
  );
}

export function getGapSegments(segments: ClozeSegment[]): GapSegment[] {
  return segments.filter(
    (segment): segment is GapSegment => segment.type === "gap",
  );
}

export function findFirstEmptyGapId(
  gaps: GapSegment[],
  userAnswers: UserAnswer,
): string | null {
  for (const gap of gaps) {
    if (!userAnswers[gap.id]) {
      return gap.id;
    }
  }
  return null;
}

export function isItemPlaced(itemId: string, userAnswers: UserAnswer): boolean {
  return Object.values(userAnswers).includes(itemId);
}

export function getItemById(
  items: WordItem[],
  itemId: string,
): WordItem | undefined {
  return items.find((item) => item.id === itemId);
}
