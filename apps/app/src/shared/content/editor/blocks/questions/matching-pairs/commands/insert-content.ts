import {
  MATCHING_PAIR_NODE_NAME,
  MATCHING_PAIR_SIDE_NODE_NAME,
} from "@/shared/content/editor/blocks/questions/matching-pairs/schema";
import { createMatchingItemIds } from "@/shared/content/editor/blocks/questions/matching-pairs/utils/matching-pairs-data";

const DEFAULT_INSERT_PAIRS = [
  { left: "Kaffee", right: "caffè" },
  { left: "Tee", right: "tè" },
  { left: "Croissant", right: "cornetto" },
] as const;

type MatchingPairInsertContent = {
  type: typeof MATCHING_PAIR_NODE_NAME;
  attrs: { id: string };
  content: [
    {
      type: typeof MATCHING_PAIR_SIDE_NODE_NAME;
      attrs: { side: "left"; itemId: string };
      content: Array<{
        type: "paragraph";
        content: Array<{ type: "text"; text: string }>;
      }>;
    },
    {
      type: typeof MATCHING_PAIR_SIDE_NODE_NAME;
      attrs: { side: "right"; itemId: string };
      content: Array<{
        type: "paragraph";
        content: Array<{ type: "text"; text: string }>;
      }>;
    },
  ];
};

export function buildDefaultMatchingPairsInsertContent(): MatchingPairInsertContent[] {
  return DEFAULT_INSERT_PAIRS.map(({ left, right }) => {
    const ids = createMatchingItemIds();
    return {
      type: MATCHING_PAIR_NODE_NAME,
      attrs: { id: ids.pairId },
      content: [
        {
          type: MATCHING_PAIR_SIDE_NODE_NAME,
          attrs: { side: "left", itemId: ids.leftItemId },
          content: [
            { type: "paragraph", content: [{ type: "text", text: left }] },
          ],
        },
        {
          type: MATCHING_PAIR_SIDE_NODE_NAME,
          attrs: { side: "right", itemId: ids.rightItemId },
          content: [
            { type: "paragraph", content: [{ type: "text", text: right }] },
          ],
        },
      ],
    };
  });
}
