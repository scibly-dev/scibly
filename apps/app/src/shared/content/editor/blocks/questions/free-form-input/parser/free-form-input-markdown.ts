import type {
  QuestionData,
  UserAnswer,
} from "@/shared/content/editor/blocks/questions/free-form-input/schema";

import {
  defaultAnswerData,
  defaultQuestionData,
  FREE_FORM_INPUT_NODE_NAME,
} from "@/shared/content/editor/blocks/questions/free-form-input/schema";
import {
  createQuestionBlockMarkdownSpec,
  type QuestionBlockMarkdownConfig,
} from "@/shared/content/editor/blocks/questions/parser/question-block-markdown";

const freeFormInputMarkdownConfig: QuestionBlockMarkdownConfig<
  QuestionData,
  UserAnswer
> = {
  nodeName: FREE_FORM_INPUT_NODE_NAME,
  name: "freeFormInput",
  defaultQuestionData,
  defaultAnswerData,

  serializeQuestionData: (questionData) => {
    const attrs: Record<string, string> = {};
    if (questionData.minLength !== undefined) {
      attrs.minLength = String(questionData.minLength);
    }
    if (questionData.maxLength !== undefined) {
      attrs.maxLength = String(questionData.maxLength);
    }
    return attrs;
  },

  parseQuestionData: (attrs) => {
    const minLength = attrs.get("minLength");
    const maxLength = attrs.get("maxLength");
    return {
      minLength: minLength ? Number(minLength) : undefined,
      maxLength: maxLength ? Number(maxLength) : undefined,
    };
  },
};

export const freeFormInputMarkdownSpec = createQuestionBlockMarkdownSpec(
  freeFormInputMarkdownConfig,
);
