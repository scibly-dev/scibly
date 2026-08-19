import type { NodeViewRenderer } from "@tiptap/core";
import type {
  QuestionData,
  UserAnswer,
} from "@/shared/content/editor/blocks/questions/input-field/schema";

import { mergeAttributes, Node } from "@tiptap/core";

import { defaultQuestionBlockAttributes } from "@/shared/content/editor/blocks/attributes/default-question-block-attributes";
import getDefaultReactBlockAttributes from "@/shared/content/editor/blocks/attributes/get-default-react-block-attributes";
import { inputFieldMarkdownSpec } from "@/shared/content/editor/blocks/questions/input-field/parser/input-field-markdown";
import {
  defaultAnswerData,
  defaultQuestionData,
  INPUT_FIELD_NODE_NAME,
} from "@/shared/content/editor/blocks/questions/input-field/schema";
import { questionBlockSchemaAttribute } from "@/shared/content/editor/html-schema/question-block-schema";

const PDF_STYLES =
  "border-bottom: 1px solid black; padding: 10px; max-width: 100%;";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    insertInputField: {
      insertInputField: (answer?: string) => ReturnType;
    };
  }
}

type InputFieldNodeOptions = Readonly<{ nodeView?: NodeViewRenderer }>;

export function createInputFieldNode(options: InputFieldNodeOptions = {}) {
  const nodeView = options.nodeView;
  return Node.create({
    name: INPUT_FIELD_NODE_NAME,
    group: "inline",
    atom: true,
    inline: true,
    selectable: false,

    addAttributes() {
      return getDefaultReactBlockAttributes<QuestionData, UserAnswer>({
        questionBlock: { defaultQuestionData, defaultAnswerData },
      });
    },

    parseHTML() {
      return [{ tag: `span[data-type='${INPUT_FIELD_NODE_NAME}']` }];
    },

    // eslint-disable-next-line @typescript-eslint/naming-convention
    renderHTML({ HTMLAttributes, node }) {
      const questionData =
        node.attrs?.questionBlockAttributes?.questionData ??
        defaultQuestionData;
      const charCount = questionData.answer.length;
      const averageCharWidth = 8.5;
      const padding = 10;
      const width = padding + averageCharWidth * charCount;
      return [
        "span",
        mergeAttributes(HTMLAttributes, {
          "data-type": INPUT_FIELD_NODE_NAME,
          style: `${PDF_STYLES} width: ${width}px;`,
        }),
      ];
    },

    addNodeView: nodeView ? () => nodeView : undefined,

    addHtmlSchemaAwareness() {
      return {
        tag: "span",
        name: "Input Field",
        description:
          "An inline fill-in-the-blank input field. Learners type their answer which is compared against the stored correct answer.",
        attributes: [
          {
            attr: "data-type",
            value: INPUT_FIELD_NODE_NAME,
            description: "Identifies this span as an input field node",
          },
          questionBlockSchemaAttribute(defaultQuestionData),
        ],
      };
    },

    addCommands() {
      return {
        insertInputField:
          (answer?: string) =>
          ({ commands }) =>
            commands.insertContent({
              type: this.name,
              attrs: {
                questionBlockAttributes: {
                  ...defaultQuestionBlockAttributes,
                  userAnswers: defaultAnswerData,
                  questionData: {
                    ...defaultQuestionData,
                    answer: answer || defaultQuestionData.answer,
                  },
                },
              },
            }),
      };
    },

    ...inputFieldMarkdownSpec,
  });
}
