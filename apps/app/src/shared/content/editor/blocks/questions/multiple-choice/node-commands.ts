import type { JSONContent } from "@tiptap/core";

import { defaultQuestionBlockAttributes } from "@/shared/content/editor/blocks/attributes/default-question-block-attributes";
import {
  defaultAnswerData,
  defaultQuestionData,
  MULTIPLE_CHOICE_NODE_NAME,
} from "@/shared/content/editor/blocks/questions/multiple-choice/schema";
import { questionBlockSchemaAttribute } from "@/shared/content/editor/html-schema/question-block-schema";

export function multipleChoiceHtmlSchemaAwareness() {
  return {
    tag: "div",
    name: "Multiple Choice",
    description: "A block for multiple choice questions.",
    attributes: [
      {
        attr: "data-type",
        value: MULTIPLE_CHOICE_NODE_NAME,
        description: "Identifies this block as a multiple choice node",
      },
      questionBlockSchemaAttribute(defaultQuestionData),
    ],
  };
}

export function insertMultipleChoiceCommand({
  insertContent,
  nodeName,
}: {
  insertContent: (content: JSONContent) => boolean;
  nodeName: string;
}) {
  return insertContent({
    type: nodeName,
    attrs: {
      questionBlockAttributes: {
        ...defaultQuestionBlockAttributes,
        userAnswers: defaultAnswerData,
        questionData: defaultQuestionData,
      },
    },
  });
}
