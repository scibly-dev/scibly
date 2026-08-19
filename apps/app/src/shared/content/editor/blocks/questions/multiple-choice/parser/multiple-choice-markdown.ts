import type {
  QuestionData,
  UserAnswer,
} from "@/shared/content/editor/blocks/questions/multiple-choice/schema";

import { MULTIPLE_CHOICE_NODE_NAME } from "@/shared/content/editor/blocks/questions/multiple-choice/schema";
import {
  defaultAnswerData,
  defaultQuestionData,
} from "@/shared/content/editor/blocks/questions/multiple-choice/schema";
import { createQuestionBlockMarkdownSpec } from "@/shared/content/editor/blocks/questions/parser/question-block-markdown";
import { type QuestionBlockMarkdownConfig } from "@/shared/content/editor/blocks/questions/parser/question-block-markdown";

const multipleChoiceMarkdownConfig: QuestionBlockMarkdownConfig<
  QuestionData,
  UserAnswer
> = {
  nodeName: MULTIPLE_CHOICE_NODE_NAME,
  name: "multipleChoice",
  isBlock: true,
  defaultQuestionData,
  defaultAnswerData,

  serializeQuestionData: (questionData) => {
    return {
      choices: encodeURIComponent(JSON.stringify(questionData.choices)),
      correctChoiceIds: encodeURIComponent(
        JSON.stringify(questionData.correctChoiceIds),
      ),
      allowMultiple: questionData.allowMultiple ? "true" : "false",
    };
  },

  parseQuestionData: (attrs) => {
    try {
      const rawChoices = attrs.get("choices");
      const rawCorrect = attrs.get("correctChoiceIds");
      return {
        choices: rawChoices
          ? JSON.parse(decodeURIComponent(rawChoices))
          : defaultQuestionData.choices,
        correctChoiceIds: rawCorrect
          ? JSON.parse(decodeURIComponent(rawCorrect))
          : defaultQuestionData.correctChoiceIds,
        allowMultiple: attrs.get("allowMultiple") === "true",
      };
    } catch {
      return defaultQuestionData;
    }
  },
};

export const multipleChoiceMarkdownSpec = createQuestionBlockMarkdownSpec(
  multipleChoiceMarkdownConfig,
);
