import { mergeAttributes, Node } from "@tiptap/core";
import { createBlockMarkdownSpec } from "@tiptap/core";

import { CUSTOM_COLUMN_NODE_NAME } from "@/shared/content/editor/blocks/column/schema";
import { NESTABLE_BLOCK_CONTENT } from "@/shared/content/editor/blocks/registry/content-groups";

export const Column = Node.create({
  name: CUSTOM_COLUMN_NODE_NAME,

  content: NESTABLE_BLOCK_CONTENT,

  isolating: true,

  addAttributes() {
    return {
      position: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-position"),

        renderHTML: (attributes) => ({ "data-position": attributes.position }),
      },
    };
  },

  addHtmlSchemaAwareness() {
    return {
      tag: "div",
      name: "Column",
      description:
        "A single column inside a two-column layout. Holds block-level content like paragraphs and headings.",
      attributes: [
        {
          attr: "data-type",
          value: "column",
          description: "Identifies this div as a column container",
        },
        {
          attr: "data-position",
          description:
            'Position of the column in the layout. Can be "left" or "right"',
        },
      ],
    };
  },

  // eslint-disable-next-line @typescript-eslint/naming-convention
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "column" }),
      0,
    ];
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="column"]',
      },
    ];
  },

  ...createBlockMarkdownSpec({
    nodeName: CUSTOM_COLUMN_NODE_NAME,
    name: "column",
    content: "block",
    allowedAttributes: ["position"],
  }),
});

export default Column;
