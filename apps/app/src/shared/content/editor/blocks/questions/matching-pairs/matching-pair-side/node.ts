import { mergeAttributes, Node } from "@tiptap/core";

import { MATCHING_PAIR_SIDE_NODE_NAME } from "@/shared/content/editor/blocks/questions/matching-pairs/schema";
import { MATCHING_PAIR_SIDE_CONTENT } from "@/shared/content/editor/blocks/questions/matching-pairs/utils/matching-pair-side-content";

export const MatchingPairSide = Node.create({
  name: MATCHING_PAIR_SIDE_NODE_NAME,

  content: MATCHING_PAIR_SIDE_CONTENT,

  defining: true,

  isolating: true,

  addAttributes() {
    return {
      side: {
        default: "left",
        parseHTML: (element) => element.getAttribute("data-side") || "left",
        renderHTML: (attributes) => ({ "data-side": attributes.side }),
      },
      itemId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-item-id"),
        renderHTML: (attributes) =>
          attributes.itemId ? { "data-item-id": attributes.itemId } : {},
      },
    };
  },

  addHtmlSchemaAwareness() {
    return {
      tag: "div",
      name: "Matching Pair Side",
      description:
        "One side of a matching pair. Holds rich block content such as text, images, math, or audio.",
      attributes: [
        {
          attr: "data-type",
          value: "matching-pair-side",
          description: "Identifies this div as a matching pair side",
        },
        {
          attr: "data-side",
          description: 'Which column this side belongs to: "left" or "right"',
        },
        {
          attr: "data-item-id",
          description: "Stable id used for learner matching interactions",
        },
      ],
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="matching-pair-side"]',
      },
    ];
  },

  // eslint-disable-next-line @typescript-eslint/naming-convention
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "matching-pair-side",
        class: "matching-pair-side",
      }),
      0,
    ];
  },
});

export default MatchingPairSide;
