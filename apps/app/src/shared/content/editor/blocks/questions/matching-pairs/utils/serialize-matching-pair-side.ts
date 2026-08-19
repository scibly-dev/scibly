import type { Node as PMNode } from "@tiptap/pm/model";

import { stringAttribute } from "@/shared/content/editor/blocks/attributes/string-attribute";
import {
  MATCHING_PAIR_NODE_NAME,
  MATCHING_PAIR_SIDE_NODE_NAME,
} from "@/shared/content/editor/blocks/questions/matching-pairs/schema";

export type MatchingPairSideTile = {
  side: "left" | "right";
  itemId: string;
  sideNode: PMNode;
  pairIndex: number;
};

export function extractSideTilesFromNode(node: PMNode): MatchingPairSideTile[] {
  const tiles: MatchingPairSideTile[] = [];
  let pairIndex = 0;

  node.forEach((pairNode) => {
    if (pairNode.type.name !== MATCHING_PAIR_NODE_NAME) return;

    pairNode.forEach((sideNode) => {
      if (sideNode.type.name !== MATCHING_PAIR_SIDE_NODE_NAME) return;

      const side = sideNode.attrs.side;
      const itemId = stringAttribute(sideNode, "itemId");
      if ((side !== "left" && side !== "right") || !itemId) return;

      tiles.push({
        side,
        itemId,
        sideNode,
        pairIndex,
      });
    });

    pairIndex += 1;
  });

  return tiles;
}
