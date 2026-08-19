import type { NodeViewRenderer } from "@tiptap/core";
import type {
  QuestionData,
  UserAnswer,
} from "@/shared/content/editor/blocks/questions/multiple-choice/schema";

import { mergeAttributes, Node } from "@tiptap/core";

import getDefaultReactBlockAttributes from "@/shared/content/editor/blocks/attributes/get-default-react-block-attributes";
import {
  insertMultipleChoiceCommand,
  multipleChoiceHtmlSchemaAwareness,
} from "@/shared/content/editor/blocks/questions/multiple-choice/node-commands";
import { multipleChoiceMarkdownSpec } from "@/shared/content/editor/blocks/questions/multiple-choice/parser/multiple-choice-markdown";
import {
  defaultAnswerData,
  defaultQuestionData,
  MULTIPLE_CHOICE_NODE_NAME,
} from "@/shared/content/editor/blocks/questions/multiple-choice/schema";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    insertMultipleChoice: {
      insertMultipleChoice: () => ReturnType;
    };
  }
}

type MultipleChoiceNodeOptions = Readonly<{
  nodeView?: NodeViewRenderer;
}>;

export function createMultipleChoiceNode(
  options: MultipleChoiceNodeOptions = {},
) {
  const nodeView = options.nodeView;

  return Node.create({
    name: MULTIPLE_CHOICE_NODE_NAME,
    group: "block",
    atom: true,
    selectable: true,

    addAttributes() {
      return getDefaultReactBlockAttributes<QuestionData, UserAnswer>({
        questionBlock: { defaultQuestionData, defaultAnswerData },
      });
    },

    parseHTML() {
      return [{ tag: `div[data-type='${MULTIPLE_CHOICE_NODE_NAME}']` }];
    },

    // eslint-disable-next-line @typescript-eslint/naming-convention
    renderHTML({ HTMLAttributes }) {
      return [
        "div",
        mergeAttributes(HTMLAttributes, {
          "data-type": MULTIPLE_CHOICE_NODE_NAME,
        }),
      ];
    },

    addNodeView: nodeView ? () => nodeView : undefined,

    addHtmlSchemaAwareness() {
      return multipleChoiceHtmlSchemaAwareness();
    },

    addCommands() {
      return {
        insertMultipleChoice:
          () =>
          ({ commands }) =>
            insertMultipleChoiceCommand({
              insertContent: commands.insertContent,
              nodeName: this.name,
            }),
      };
    },

    ...multipleChoiceMarkdownSpec,
  });
}
