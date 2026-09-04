import type { Content } from "@tiptap/core";
import type { QuestionBlocksType } from "@/shared/content/editor/blocks/registry/shared";

import { z } from "zod";

export const QUESTION_BLOCK_AUTHORING_FIELDS = [
  "optional",
  "questionData",
  "maxPoints",
  "sp",
] as const;

export const questionBlockAttributesBaseSchema = z
  .object({
    optional: z.boolean().optional(),
    questionData: z.unknown().optional(),
    userAnswers: z.unknown().optional(),
    maxPoints: z.number().optional(),
    achievedPoints: z.number().optional(),
    sp: z.number().optional(),
  })
  .passthrough();

export const questionBlockAttributesSchema =
  questionBlockAttributesBaseSchema.superRefine((data, ctx) => {
    if (data.maxPoints === 0) {
      ctx.addIssue({
        code: "custom",
        message:
          "maxPoints of exactly 0 is not a legal value; leave it unset to use the default",
        path: ["maxPoints"],
      });
    }
    if (data.sp === 0) {
      ctx.addIssue({
        code: "custom",
        message:
          "sp of exactly 0 is not a legal value; leave it unset to use the default",
        path: ["sp"],
      });
    }
  });

export type QuestionBlockAttributes = z.infer<
  typeof questionBlockAttributesSchema
>;

export type QuestionBlockSnapshot = Readonly<{
  blockId: string;
  blockType: QuestionBlocksType;
  attributes: Readonly<QuestionBlockAttributes>;
}>;

export type LearnerQuestionBlock = Readonly<{
  blockId: string;
  attributes: Readonly<QuestionBlockAttributes>;
}>;

export type PublishArtifacts = Readonly<{
  learnerDocument: readonly LearnerQuestionBlock[];
  gradingManifest: readonly Readonly<{
    blockId: string;
    blockType: QuestionBlocksType;
    questionData: unknown;
    maxPoints?: number;
    sp?: number;
  }>[];
}>;

/**
 * `kind` is the discriminator, not the runtime type of `learnerContent`: a
 * legacy raw-HTML DOCUMENT scene is a bare string too.
 */
export type PublishedSceneContent =
  | { kind: "PRACTICE"; learnerContent: string }
  | { kind: "DOCUMENT"; learnerContent: Content };

/** `blockType` comes off the DB by cast, not a parse, so grading validates it. */
export type StoredGradingManifest = readonly Readonly<
  Omit<PublishArtifacts["gradingManifest"][number], "blockType"> & {
    blockType: string;
  }
>[];

export const blockSubmissionSchema = z.object({
  blockId: z.string(),
  blockType: z.string(),
  learnerAnswer: z.unknown(),
});

export type BlockSubmission = z.infer<typeof blockSubmissionSchema>;

export type GradedBlock = {
  blockId: string;
  blockType: QuestionBlocksType;
  achievedPoints: number;
  maxPoints: number;
  spEarned: number;
  correctAnswer?: unknown;
};

export type GradingResult = {
  gradedBlocks: GradedBlock[];
  totalSpEarned: number;
};

/** Rows predating a field fall back via `.catch()`; one with no `blockId` names no question. */
export const persistedGradedBlockSchema = z.object({
  blockId: z.string(),
  blockType: z.string().catch(""),
  learnerAnswer: z.unknown(),
  achievedPoints: z.number().catch(0),
  maxPoints: z.number().catch(0),
  spEarned: z.number().catch(0),
  correctAnswer: z.unknown().optional(),
});

export type PersistedGradedBlock = z.infer<typeof persistedGradedBlockSchema>;

export function parsePersistedGradedBlocks(
  value: unknown,
): PersistedGradedBlock[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const parsed = persistedGradedBlockSchema.safeParse(entry);
    return parsed.success ? [parsed.data] : [];
  });
}

export type DisplayedGrade = Omit<GradedBlock, "blockType">;

export type AnswerCorrectness = {
  correct: number;
  total: number;
};
