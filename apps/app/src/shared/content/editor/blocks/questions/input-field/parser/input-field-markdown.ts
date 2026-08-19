import type {
  QuestionData,
  UserAnswer,
} from "@/shared/content/editor/blocks/questions/input-field/schema";

import { INPUT_FIELD_NODE_NAME } from "@/shared/content/editor/blocks/questions/input-field/schema";
import {
  defaultAnswerData,
  defaultQuestionData,
} from "@/shared/content/editor/blocks/questions/input-field/schema";
import { createQuestionBlockMarkdownSpec } from "@/shared/content/editor/blocks/questions/parser/question-block-markdown";
import { type QuestionBlockMarkdownConfig } from "@/shared/content/editor/blocks/questions/parser/question-block-markdown";

const inputFieldMarkdownConfig: QuestionBlockMarkdownConfig<
  QuestionData,
  UserAnswer
> = {
  nodeName: INPUT_FIELD_NODE_NAME,
  name: "inputField",
  defaultQuestionData,
  defaultAnswerData,

  serializeQuestionData: (questionData) => {
    const attrs: Record<string, string> = {};
    if (questionData.answer) {
      attrs.answer = questionData.answer;
    }
    if (questionData.caseSensitive === false) {
      attrs.caseSensitive = "false";
    }
    return attrs;
  },

  parseQuestionData: (attrs) => ({
    answer: attrs.get("answer") ?? defaultQuestionData.answer,
    caseSensitive: attrs.get("caseSensitive") !== "false",
  }),
};

export const inputFieldMarkdownSpec = createQuestionBlockMarkdownSpec(
  inputFieldMarkdownConfig,
);
