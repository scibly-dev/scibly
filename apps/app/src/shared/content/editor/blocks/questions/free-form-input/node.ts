import type { NodeViewRenderer } from "@tiptap/core";
import type {
  QuestionData,
  UserAnswer,
} from "@/shared/content/editor/blocks/questions/free-form-input/schema";

import { mergeAttributes, Node } from "@tiptap/core";

import { defaultQuestionBlockAttributes } from "@/shared/content/editor/blocks/attributes/default-question-block-attributes";
import getDefaultReactBlockAttributes from "@/shared/content/editor/blocks/attributes/get-default-react-block-attributes";
import { freeFormInputMarkdownSpec } from "@/shared/content/editor/blocks/questions/free-form-input/parser/free-form-input-markdown";
import {
  defaultAnswerData,
  defaultQuestionData,
  FREE_FORM_INPUT_NODE_NAME,
} from "@/shared/content/editor/blocks/questions/free-form-input/schema";
import { questionBlockSchemaAttribute } from "@/shared/content/editor/html-schema/question-block-schema";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    insertFreeFormInput: {
      insertFreeFormInput: () => ReturnType;
    };
  }
}

type FreeFormInputNodeOptions = Readonly<{ nodeView?: NodeViewRenderer }>;

export function createFreeFormInputNode(
  options: FreeFormInputNodeOptions = {},
) {
  const nodeView = options.nodeView;
  return Node.create({
    name: FREE_FORM_INPUT_NODE_NAME,
    group: "block",
    atom: true,
    selectable: true,

    addAttributes() {
      return getDefaultReactBlockAttributes<QuestionData, UserAnswer>({
        questionBlock: { defaultQuestionData, defaultAnswerData },
      });
    },

    parseHTML() {
      return [{ tag: `div[data-type='${FREE_FORM_INPUT_NODE_NAME}']` }];
    },

    // eslint-disable-next-line @typescript-eslint/naming-convention
    renderHTML({ HTMLAttributes }) {
      return [
        "div",
        mergeAttributes(HTMLAttributes, {
          "data-type": FREE_FORM_INPUT_NODE_NAME,
          class: "free-form-input-placeholder",
        }),
      ];
    },

    addNodeView: nodeView ? () => nodeView : undefined,

    addHtmlSchemaAwareness() {
      return {
        tag: "div",
        name: "Free Form Input",
        description:
          "A block-level textarea where learners can type open-ended free-form answers. The answer is not automatically checked for correctness.",
        attributes: [
          {
            attr: "data-type",
            value: FREE_FORM_INPUT_NODE_NAME,
            description: "Identifies this div as a free form input node",
          },
          questionBlockSchemaAttribute(defaultQuestionData),
        ],
      };
    },

    addCommands() {
      return {
        insertFreeFormInput:
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

    ...freeFormInputMarkdownSpec,
  });
}
