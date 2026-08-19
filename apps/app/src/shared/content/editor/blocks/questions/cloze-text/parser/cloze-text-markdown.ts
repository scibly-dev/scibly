import type {
  QuestionData,
  UserAnswer,
} from "@/shared/content/editor/blocks/questions/cloze-text/schema";

import { CLOZE_TEXT_NODE_NAME } from "@/shared/content/editor/blocks/questions/cloze-text/schema";
import {
  defaultAnswerData,
  defaultQuestionData,
} from "@/shared/content/editor/blocks/questions/cloze-text/schema";
import { createQuestionBlockMarkdownSpec } from "@/shared/content/editor/blocks/questions/parser/question-block-markdown";
import { type QuestionBlockMarkdownConfig } from "@/shared/content/editor/blocks/questions/parser/question-block-markdown";

const clozeTextMarkdownConfig: QuestionBlockMarkdownConfig<
  QuestionData,
  UserAnswer
> = {
  nodeName: CLOZE_TEXT_NODE_NAME,
  name: "clozeText",
  isBlock: true,
  defaultQuestionData,
  defaultAnswerData,

  serializeQuestionData: (questionData) => ({
    segments: encodeURIComponent(JSON.stringify(questionData.segments)),
    items: encodeURIComponent(JSON.stringify(questionData.items)),
  }),

  parseQuestionData: (attrs) => {
    try {
      const rawSegments = attrs.get("segments");
      const rawItems = attrs.get("items");
      return {
        segments: rawSegments
          ? JSON.parse(decodeURIComponent(rawSegments))
          : defaultQuestionData.segments,
        items: rawItems
          ? JSON.parse(decodeURIComponent(rawItems))
          : defaultQuestionData.items,
      };
    } catch {
      return defaultQuestionData;
    }
  },
};

export const clozeTextMarkdownSpec = createQuestionBlockMarkdownSpec(
  clozeTextMarkdownConfig,
);
