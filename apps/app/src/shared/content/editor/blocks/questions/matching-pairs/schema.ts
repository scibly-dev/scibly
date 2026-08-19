import { z } from "zod";

export const MATCHING_PAIRS_NODE_NAME = "custom-matching-pairs";

export const MATCHING_PAIRS_GROUP = "matchingPairs";
export const MATCHING_PAIR_NODE_NAME = "matchingPair";
export const MATCHING_PAIR_SIDE_NODE_NAME = "matchingPairSide";

export type MatchingPairMeta = {
  pairId: string;
  leftItemId: string;
  rightItemId: string;
};

export type QuestionData = {
  pairs: MatchingPairMeta[];
  rightColumnOrder: string[];

  correctMappings?: Record<string, string>;
};

export type UserAnswer = Record<string, string>;

export const defaultQuestionData: QuestionData = {
  pairs: [],
  rightColumnOrder: [],
};

export const defaultAnswerData: UserAnswer = {};

export const userAnswerStructureSchema = z.record(z.string(), z.string());

export const questionDataStructureSchema = z.strictObject({
  pairs: z.array(
    z.strictObject({
      pairId: z.string(),
      leftItemId: z.string(),
      rightItemId: z.string(),
    }),
  ),
  rightColumnOrder: z.array(z.string()),
  correctMappings: z.record(z.string(), z.string()).optional(),
});

const pairMetaSchema = z.object({
  pairId: z.string(),
  leftItemId: z.string(),
  rightItemId: z.string(),
});

export const matchingPairsSchema = z.object({
  pairs: z.array(pairMetaSchema).min(1, "At least one pair is required"),
  rightColumnOrder: z
    .array(z.string())
    .min(1, "Right column order is required"),
  correctMappings: z.record(z.string(), z.string()).optional(),
});
