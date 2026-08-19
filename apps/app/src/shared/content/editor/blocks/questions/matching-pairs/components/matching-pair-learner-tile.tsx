"use client";

import type { Node as PMNode } from "@tiptap/pm/model";

import { cn } from "@scibly/ui/utils";
import { memo } from "react";

import {
  matchingPairTileClassName,
  SIDE_CONTENT_CLASS,
} from "@/shared/content/editor/blocks/questions/matching-pairs/utils/matching-pair-learner-tile-utils";
import { ProseMirrorContentHtml } from "@/shared/content/editor/blocks/ui/prosemirror-content-html";
import {
  QACelebrationMotion,
  type QAGradedItemStatus,
} from "@/shared/content/editor/blocks/ui/qa-celebration";

type MatchingPairLearnerTileProps = {
  sideNode: PMNode;
  gradedStatus: QAGradedItemStatus;
  isGraded: boolean;
  isSelected: boolean;
  isMatched: boolean;
  showGradedColors: boolean;
  interactive: boolean;
  celebrateKey: number;
  celebrateEnabled: boolean;
  staggerIndex: number;
  onActivate?: () => void;
};

export const MatchingPairLearnerTile = memo(
  ({
    sideNode,
    gradedStatus,
    isGraded,
    isSelected,
    isMatched,
    showGradedColors,
    interactive,
    celebrateKey,
    celebrateEnabled,
    staggerIndex,
    onActivate,
  }: MatchingPairLearnerTileProps) => {
    const face = (
      <div
        className={matchingPairTileClassName({
          gradedStatus,
          isGraded,
          isSelected,
          interactive,
          showGradedColors,
          isMatched,
        })}
      >
        <ProseMirrorContentHtml
          node={sideNode}
          className={SIDE_CONTENT_CLASS}
        />
      </div>
    );

    return (
      <div
        className={cn("h-full w-full", interactive && "touch-manipulation")}
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        onClick={() => {
          if (interactive) onActivate?.();
        }}
        onKeyDown={(event) => {
          if (!interactive) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onActivate?.();
          }
        }}
      >
        <div className="matching-pair-tile-fade h-full w-full">
          <QACelebrationMotion
            block
            className="h-full w-full"
            celebrateKey={celebrateKey}
            enabled={celebrateEnabled}
            staggerIndex={staggerIndex}
          >
            {face}
          </QACelebrationMotion>
        </div>
      </div>
    );
  },
);

MatchingPairLearnerTile.displayName = "MatchingPairLearnerTile";
