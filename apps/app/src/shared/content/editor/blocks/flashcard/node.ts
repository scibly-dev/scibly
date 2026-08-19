import type { NodeViewRenderer } from "@tiptap/core";

import { createBlockMarkdownSpec, mergeAttributes, Node } from "@tiptap/core";

import getDefaultReactBlockAttributes from "@/shared/content/editor/blocks/attributes/get-default-react-block-attributes";
import {
  CUSTOM_FLASHCARD_FACE_NODE_NAME,
  CUSTOM_FLASHCARD_NODE_NAME,
} from "@/shared/content/editor/blocks/flashcard/schema";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    flashcard: {
      insertFlashcard: () => ReturnType;
    };
  }
}

type FlashcardNodeOptions = Readonly<{
  nodeView?: NodeViewRenderer;
}>;

const flashcardNode = Node.create({
  name: CUSTOM_FLASHCARD_NODE_NAME,

  group: CUSTOM_FLASHCARD_NODE_NAME,

  content: `${CUSTOM_FLASHCARD_FACE_NODE_NAME} ${CUSTOM_FLASHCARD_FACE_NODE_NAME}`,

  isolating: true,
  defining: true,

  addAttributes() {
    return {
      ...getDefaultReactBlockAttributes({ isResizable: false }),
      theme: {
        default: "default",
      },
    };
  },

  addCommands() {
    return {
      insertFlashcard:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: CUSTOM_FLASHCARD_NODE_NAME,
            content: [
              {
                type: CUSTOM_FLASHCARD_FACE_NODE_NAME,
                attrs: { position: "front" },
                content: [{ type: "paragraph" }],
              },
              {
                type: CUSTOM_FLASHCARD_FACE_NODE_NAME,
                attrs: { position: "back" },
                content: [{ type: "paragraph" }],
              },
            ],
          }),
    };
  },

  addHtmlSchemaAwareness() {
    return {
      tag: "div",
      name: "Flashcard",
      description:
        "An interactive flashcard container. Contains exactly two children: flashcard-front and flashcard-back.",
      attributes: [
        {
          attr: "data-type",
          value: "flashcard",
          description: "Identifies this div as a flashcard container",
        },
        {
          attr: "data-theme",
          description:
            'Color theme of the flashcard (e.g. "default", "blue", "green", "yellow")',
        },
      ],
    };
  },

  // eslint-disable-next-line @typescript-eslint/naming-convention
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "flashcard" }),
      0,
    ];
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="flashcard"]',
      },
    ];
  },

  ...createBlockMarkdownSpec({
    nodeName: CUSTOM_FLASHCARD_NODE_NAME,
    name: "flashcard",
    content: "block",
    allowedAttributes: ["theme"],
  }),
});

export function createFlashcardNode(options: FlashcardNodeOptions = {}) {
  const nodeView = options.nodeView;
  return flashcardNode.extend(
    nodeView
      ? {
          addNodeView() {
            return nodeView;
          },
        }
      : {},
  );
}
