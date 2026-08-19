import type { NodeViewRenderer } from "@tiptap/core";
import type {
  QuestionData,
  UserAnswer,
} from "@/shared/content/editor/blocks/questions/drag-and-drop/schema";

import { mergeAttributes, Node } from "@tiptap/core";

import { defaultQuestionBlockAttributes } from "@/shared/content/editor/blocks/attributes/default-question-block-attributes";
import getDefaultReactBlockAttributes from "@/shared/content/editor/blocks/attributes/get-default-react-block-attributes";
import { dragAndDropMarkdownSpec } from "@/shared/content/editor/blocks/questions/drag-and-drop/parser/drag-and-drop-markdown";
import {
  defaultAnswerData,
  defaultQuestionData,
  DRAG_AND_DROP_NODE_NAME,
} from "@/shared/content/editor/blocks/questions/drag-and-drop/schema";
import { questionBlockSchemaAttribute } from "@/shared/content/editor/html-schema/question-block-schema";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    insertDragAndDrop: {
      insertDragAndDrop: () => ReturnType;
    };
  }
}

type DragAndDropNodeOptions = Readonly<{ nodeView?: NodeViewRenderer }>;

export function createDragAndDropNode(options: DragAndDropNodeOptions = {}) {
  const nodeView = options.nodeView;
  return Node.create({
    name: DRAG_AND_DROP_NODE_NAME,
    group: "block",
    atom: true,
    selectable: true,

    addAttributes() {
      return getDefaultReactBlockAttributes<QuestionData, UserAnswer>({
        questionBlock: { defaultQuestionData, defaultAnswerData },
      });
    },

    parseHTML() {
      return [{ tag: `div[data-type='${DRAG_AND_DROP_NODE_NAME}']` }];
    },

    // eslint-disable-next-line @typescript-eslint/naming-convention
    renderHTML({ HTMLAttributes }) {
      return [
        "div",
        mergeAttributes(HTMLAttributes, {
          "data-type": DRAG_AND_DROP_NODE_NAME,
        }),
      ];
    },

    addNodeView: nodeView ? () => nodeView : undefined,

    addHtmlSchemaAwareness() {
      return {
        tag: "div",
        name: "Drag & Drop",
        description: "An interactive drag and drop block for mapping items.",
        attributes: [
          {
            attr: "data-type",
            value: DRAG_AND_DROP_NODE_NAME,
            description: "Identifies this block as a Drag & Drop node",
          },
          questionBlockSchemaAttribute(defaultQuestionData),
        ],
      };
    },

    addCommands() {
      return {
        insertDragAndDrop:
          () =>
          ({ commands }) =>
            commands.insertContent({
              type: this.name,
              attrs: {
                questionBlockAttributes: {
                  ...defaultQuestionBlockAttributes,
                  userAnswers: defaultAnswerData,
                  questionData: defaultQuestionData,
                },
              },
            }),
      };
    },

    ...dragAndDropMarkdownSpec,
  });
}
