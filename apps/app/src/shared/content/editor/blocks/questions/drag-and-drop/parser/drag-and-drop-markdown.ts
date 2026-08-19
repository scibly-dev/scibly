import type {
  QuestionData,
  UserAnswer,
} from "@/shared/content/editor/blocks/questions/drag-and-drop/schema";

import { DRAG_AND_DROP_NODE_NAME } from "@/shared/content/editor/blocks/questions/drag-and-drop/schema";
import {
  defaultAnswerData,
  defaultQuestionData,
} from "@/shared/content/editor/blocks/questions/drag-and-drop/schema";
import { createQuestionBlockMarkdownSpec } from "@/shared/content/editor/blocks/questions/parser/question-block-markdown";
import { type QuestionBlockMarkdownConfig } from "@/shared/content/editor/blocks/questions/parser/question-block-markdown";

const dragAndDropMarkdownConfig: QuestionBlockMarkdownConfig<
  QuestionData,
  UserAnswer
> = {
  nodeName: DRAG_AND_DROP_NODE_NAME,
  name: "dragAndDrop",
  isBlock: true,
  defaultQuestionData,
  defaultAnswerData,

  serializeQuestionData: (questionData) => {
    return {
      items: encodeURIComponent(JSON.stringify(questionData.items)),
      zones: encodeURIComponent(JSON.stringify(questionData.zones)),
      correctMappings: encodeURIComponent(
        JSON.stringify(questionData.correctMappings),
      ),
    };
  },

  parseQuestionData: (attrs) => {
    try {
      const rawItems = attrs.get("items");
      const rawZones = attrs.get("zones");
      const rawMappings = attrs.get("correctMappings");
      return {
        items: rawItems
          ? JSON.parse(decodeURIComponent(rawItems))
          : defaultQuestionData.items,
        zones: rawZones
          ? JSON.parse(decodeURIComponent(rawZones))
          : defaultQuestionData.zones,
        correctMappings: rawMappings
          ? JSON.parse(decodeURIComponent(rawMappings))
          : defaultQuestionData.correctMappings,
      };
    } catch {
      return defaultQuestionData;
    }
  },
};

export const dragAndDropMarkdownSpec = createQuestionBlockMarkdownSpec(
  dragAndDropMarkdownConfig,
);
