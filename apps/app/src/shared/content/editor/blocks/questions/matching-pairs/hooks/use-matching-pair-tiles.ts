"use client";

import type { Node as PMNode } from "@tiptap/pm/model";
import type { QuestionData } from "@/shared/content/editor/blocks/questions/matching-pairs/schema";

import { useMemo } from "react";

import { applyDisplayOrder } from "@/shared/content/editor/assessment/learner/answer-order";
import {
  getCorrectMappings,
  getRightTileIds,
} from "@/shared/content/editor/blocks/questions/matching-pairs/utils/matching-pairs-data";
import { extractSideTilesFromNode } from "@/shared/content/editor/blocks/questions/matching-pairs/utils/serialize-matching-pair-side";

export function useMatchingPairTiles(
  blockNode: PMNode,
  questionData: QuestionData,

  displayOrder: string[] | null,
) {
  const tiles = useMemo(() => extractSideTilesFromNode(blockNode), [blockNode]);

  const leftTiles = useMemo(
    () =>
      tiles
        .filter((tile) => tile.side === "left")
        .toSorted((a, b) => a.pairIndex - b.pairIndex),
    [tiles],
  );

  const rightTiles = useMemo(
    () => tiles.filter((tile) => tile.side === "right"),
    [tiles],
  );

  const rightTileByItemId = useMemo(
    () => new Map(rightTiles.map((tile) => [tile.itemId, tile] as const)),
    [rightTiles],
  );

  const shuffledRightTiles = useMemo(
    () =>
      applyDisplayOrder(
        rightTiles,
        (tile) => tile.itemId,
        displayOrder ?? getRightTileIds(questionData),
      ),
    [displayOrder, questionData, rightTiles],
  );

  const correctMappings = useMemo(
    () => getCorrectMappings(questionData),
    [questionData],
  );

  const isShuffleAlreadyAligned = useMemo(
    () =>
      shuffledRightTiles.length === leftTiles.length &&
      shuffledRightTiles.every(
        (tile, index) =>
          correctMappings[leftTiles[index]?.itemId ?? ""] === tile.itemId,
      ),
    [correctMappings, leftTiles, shuffledRightTiles],
  );

  return {
    leftTiles,
    rightTileByItemId,
    shuffledRightTiles,
    isShuffleAlreadyAligned,
  };
}
