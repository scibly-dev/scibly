"use client";

import type { MatchingPairSideTile } from "@/shared/content/editor/blocks/questions/matching-pairs/utils/serialize-matching-pair-side";

import { cn } from "@scibly/ui/utils";
import { ArrowRight, Check, X } from "lucide-react";
import { memo } from "react";

import {
  MATCHING_PAIR_TILE_MIN_HEIGHT_CLASS,
  matchingPairTileClassName,
  SIDE_CONTENT_CLASS,
} from "@/shared/content/editor/blocks/questions/matching-pairs/utils/matching-pair-learner-tile-utils";
import { ProseMirrorContentHtml } from "@/shared/content/editor/blocks/ui/prosemirror-content-html";

export const PLAY_ROW_GAP_PX = 12;

type MatchingPairMergedRowProps = {
  leftTile: MatchingPairSideTile;
  rightTile: MatchingPairSideTile;
  isCorrect: boolean;
  isRevealed: boolean;
};

export const MatchingPairMergedRow = memo(
  ({
    leftTile,
    rightTile,
    isCorrect,
    isRevealed,
  }: MatchingPairMergedRowProps) => (
    <div className="matching-pair-merged-shell pointer-events-none absolute inset-0 z-10 min-w-0 overflow-visible">
      <div className={cn("h-full w-full", MATCHING_PAIR_TILE_MIN_HEIGHT_CLASS)}>
        <div
          className={cn(
            "matching-pair-tile-fade h-full w-full",
            !isRevealed && "matching-pair-tile-fade--in",
          )}
        >
          <div
            className={cn(
              matchingPairTileClassName({
                gradedStatus: isCorrect ? "correct" : "incorrect",
                isGraded: true,
                isSelected: false,
                interactive: false,
                showGradedColors: true,
                isMatched: false,
              }),
              "relative",
            )}
          >
            <div
              className="grid h-full w-full grid-cols-2 items-center justify-items-center"
              style={{ columnGap: PLAY_ROW_GAP_PX }}
            >
              <ProseMirrorContentHtml
                node={leftTile.sideNode}
                className={SIDE_CONTENT_CLASS}
              />
              <ProseMirrorContentHtml
                node={rightTile.sideNode}
                className={SIDE_CONTENT_CLASS}
              />
            </div>
            <span
              aria-hidden
              className={cn(
                "matching-pair-merged-row__arrow pointer-events-none",
                isCorrect
                  ? "matching-pair-merged-row__arrow--correct"
                  : "matching-pair-merged-row__arrow--incorrect",
              )}
            >
              <span className="matching-pair-merged-row__arrow-glyph">
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </span>
            </span>
            <span
              className={cn(
                "matching-pair-solution-tray__badge matching-pair-merged-row__badge",
                isCorrect
                  ? "matching-pair-solution-tray__badge--correct"
                  : "matching-pair-solution-tray__badge--incorrect",
              )}
            >
              {isCorrect ? (
                <Check className="h-3 w-3" strokeWidth={3} />
              ) : (
                <X className="h-3 w-3" strokeWidth={3} />
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  ),
);

MatchingPairMergedRow.displayName = "MatchingPairMergedRow";
