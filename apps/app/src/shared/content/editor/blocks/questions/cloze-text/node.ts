import type { NodeViewRenderer } from "@tiptap/core";
import type {
  QuestionData,
  UserAnswer,
} from "@/shared/content/editor/blocks/questions/cloze-text/schema";

import { mergeAttributes, Node } from "@tiptap/core";

import { defaultQuestionBlockAttributes } from "@/shared/content/editor/blocks/attributes/default-question-block-attributes";
import getDefaultReactBlockAttributes from "@/shared/content/editor/blocks/attributes/get-default-react-block-attributes";
import { clozeTextMarkdownSpec } from "@/shared/content/editor/blocks/questions/cloze-text/parser/cloze-text-markdown";
import { createClozeSyncPlugin } from "@/shared/content/editor/blocks/questions/cloze-text/plugins/cloze-sync-plugin";
import {
  CLOZE_TEXT_NODE_NAME,
  clozeAiSchemaExample,
  defaultAnswerData,
  defaultQuestionData,
} from "@/shared/content/editor/blocks/questions/cloze-text/schema";
import { CLOZE_TEXT_CONTENT } from "@/shared/content/editor/blocks/questions/cloze-text/utils/cloze-body-content";
import { buildClozeDocContent } from "@/shared/content/editor/blocks/questions/cloze-text/utils/cloze-doc-sync";
import { questionBlockSchemaAttribute } from "@/shared/content/editor/html-schema/question-block-schema";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    insertClozeText: {
      insertClozeText: () => ReturnType;
    };
  }
}

type ClozeTextNodeOptions = Readonly<{ nodeView?: NodeViewRenderer }>;

export function createClozeTextNode(options: ClozeTextNodeOptions = {}) {
  const nodeView = options.nodeView;
  return Node.create({
    name: CLOZE_TEXT_NODE_NAME,
    group: "block",
    content: CLOZE_TEXT_CONTENT,
    defining: true,
    isolating: true,
    selectable: true,

    addAttributes() {
      return getDefaultReactBlockAttributes<QuestionData, UserAnswer>({
        questionBlock: { defaultQuestionData, defaultAnswerData },
      });
    },

    parseHTML() {
      return [{ tag: `div[data-type='${CLOZE_TEXT_NODE_NAME}']` }];
    },

    // eslint-disable-next-line @typescript-eslint/naming-convention
    renderHTML({ HTMLAttributes }) {
      return [
        "div",
        mergeAttributes(HTMLAttributes, {
          "data-type": CLOZE_TEXT_NODE_NAME,
        }),
        0,
      ];
    },

    addNodeView: nodeView ? () => nodeView : undefined,

    addProseMirrorPlugins() {
      return [createClozeSyncPlugin(this.editor)];
    },

    addHtmlSchemaAwareness() {
      const questionBlockAttr =
        questionBlockSchemaAttribute(clozeAiSchemaExample);

      return {
        tag: "div",
        name: "Cloze Text",
        description: "Fill-in-the-blank sentence with a word bank.",
        attributes: [
          {
            attr: "data-type",
            value: CLOZE_TEXT_NODE_NAME,
            description: "Identifies this block as a cloze text node",
          },
          {
            ...questionBlockAttr,
            description: [
              questionBlockAttr.description,
              'Cloze: segments alternate text {type:"text",content} and gap {type:"gap",correctItemId}. Each gap.correctItemId must point to the item whose label is the answer — do not leave gap items empty and put answers in unlinked distractor items.',
            ].join("\n"),
          },
        ],
      };
    },

    addCommands() {
      return {
        insertClozeText:
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
              content: buildClozeDocContent(defaultQuestionData),
            }),
      };
    },

    addKeyboardShortcuts() {
      return {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Tab: () => {
          if (!this.editor.isActive(CLOZE_TEXT_NODE_NAME)) return false;
          return this.editor.commands.insertClozeGap();
        },
      };
    },

    ...clozeTextMarkdownSpec,
  });
}
