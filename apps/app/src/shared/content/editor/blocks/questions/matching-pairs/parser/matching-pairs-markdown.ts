import type {
  QuestionData,
  UserAnswer,
} from "@/shared/content/editor/blocks/questions/matching-pairs/schema";

import { MATCHING_PAIRS_NODE_NAME } from "@/shared/content/editor/blocks/questions/matching-pairs/schema";
import {
  defaultAnswerData,
  defaultQuestionData,
} from "@/shared/content/editor/blocks/questions/matching-pairs/schema";
import { buildCorrectMappings } from "@/shared/content/editor/blocks/questions/matching-pairs/utils/matching-pairs-data";
import { createQuestionBlockMarkdownSpec } from "@/shared/content/editor/blocks/questions/parser/question-block-markdown";
import { type QuestionBlockMarkdownConfig } from "@/shared/content/editor/blocks/questions/parser/question-block-markdown";

const matchingPairsMarkdownConfig: QuestionBlockMarkdownConfig<
  QuestionData,
  UserAnswer
> = {
  nodeName: MATCHING_PAIRS_NODE_NAME,
  name: "matchingPairsMeta",
  isBlock: true,
  defaultQuestionData,
  defaultAnswerData,

  serializeQuestionData: (questionData) => ({
    pairs: encodeURIComponent(JSON.stringify(questionData.pairs)),
    rightColumnOrder: encodeURIComponent(
      JSON.stringify(questionData.rightColumnOrder),
    ),
  }),

  parseQuestionData: (attrs) => {
    try {
      const rawPairs = attrs.get("pairs");
      const rawOrder = attrs.get("rightColumnOrder");
      const pairs = rawPairs
        ? JSON.parse(decodeURIComponent(rawPairs))
        : defaultQuestionData.pairs;
      const rightColumnOrder = rawOrder
        ? JSON.parse(decodeURIComponent(rawOrder))
        : defaultQuestionData.rightColumnOrder;

      return {
        pairs,
        rightColumnOrder,
        correctMappings: buildCorrectMappings(pairs),
      };
    } catch {
      return defaultQuestionData;
    }
  },
};

export const matchingPairsMarkdownSpec = createQuestionBlockMarkdownSpec(
  matchingPairsMarkdownConfig,
);
