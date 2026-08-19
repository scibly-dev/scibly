import type { NodeViewRenderer } from "@tiptap/core";

import { mergeAttributes, Node } from "@tiptap/core";

import {
  MATCHING_PAIR_NODE_NAME,
  MATCHING_PAIR_SIDE_NODE_NAME,
} from "@/shared/content/editor/blocks/questions/matching-pairs/schema";

type MatchingPairNodeOptions = Readonly<{
  nodeView?: NodeViewRenderer;
}>;

export function createMatchingPairNode(options: MatchingPairNodeOptions = {}) {
  const nodeView = options.nodeView;

  return Node.create({
    name: MATCHING_PAIR_NODE_NAME,

    content: `${MATCHING_PAIR_SIDE_NODE_NAME} ${MATCHING_PAIR_SIDE_NODE_NAME}`,

    defining: true,

    addAttributes() {
      return {
        id: {
          default: null,
          parseHTML: (element) => element.getAttribute("data-pair-id"),
          renderHTML: (attributes) =>
            attributes.id ? { "data-pair-id": attributes.id } : {},
        },
      };
    },

    addHtmlSchemaAwareness() {
      return {
        tag: "div",
        name: "Matching Pair",
        description:
          "A single matching pair row containing a left and right side.",
        attributes: [
          {
            attr: "data-type",
            value: "matching-pair",
            description: "Identifies this div as a matching pair row",
          },
          {
            attr: "data-pair-id",
            description: "Stable id for this pair row",
          },
        ],
      };
    },

    parseHTML() {
      return [
        {
          tag: 'div[data-type="matching-pair"]',
        },
      ];
    },

    // eslint-disable-next-line @typescript-eslint/naming-convention
    renderHTML({ HTMLAttributes }) {
      return [
        "div",
        mergeAttributes(HTMLAttributes, {
          "data-type": "matching-pair",
          class: "matching-pair-row",
        }),
        0,
      ];
    },

    addNodeView: nodeView ? () => nodeView : undefined,
  });
}
