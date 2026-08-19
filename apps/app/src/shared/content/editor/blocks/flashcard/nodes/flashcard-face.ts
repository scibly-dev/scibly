import { mergeAttributes, Node } from "@tiptap/core";
import { createBlockMarkdownSpec } from "@tiptap/core";

import { CUSTOM_FLASHCARD_FACE_NODE_NAME } from "@/shared/content/editor/blocks/flashcard/schema";

export const FlashcardFace = Node.create({
  name: CUSTOM_FLASHCARD_FACE_NODE_NAME,

  content: "block+",

  addAttributes() {
    return {
      position: {
        default: "front",
        parseHTML: (element) =>
          element.getAttribute("data-position") || "front",
        renderHTML: (attributes) => ({ "data-position": attributes.position }),
      },
    };
  },

  addHtmlSchemaAwareness() {
    return {
      tag: "div",
      name: "Flashcard Face",
      description: "A face of a flashcard. Holds block-level content.",
      attributes: [
        {
          attr: "data-type",
          value: "flashcard-face",
          description: "Identifies this div as a flashcard face container",
        },
        {
          attr: "data-position",
          description: "Position of the face: front or back",
        },
      ],
    };
  },

  // eslint-disable-next-line @typescript-eslint/naming-convention
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "flashcard-face",
        class: "flashcard-face",
      }),
      0,
    ];
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="flashcard-face"]',
      },
      {
        tag: "div.flashcard-face",
      },
    ];
  },

  ...createBlockMarkdownSpec({
    nodeName: CUSTOM_FLASHCARD_FACE_NODE_NAME,
    name: "flashcard-face",
    content: "block",
  }),
});

export default FlashcardFace;
