"use client";

import { cn } from "@scibly/ui/utils";
import { memo } from "react";

import { getGradedTileClassName } from "@/shared/content/editor/blocks/ui/qa-celebration/qa-celebration-tokens";
import { QA_GAME } from "@/shared/content/editor/blocks/ui/qa-celebration/qa-game-tokens";

type QASolutionPlacementChipProps = {
  label: string;
  className?: string;
};

export const QASolutionPlacementChip = memo(
  (props: QASolutionPlacementChipProps) => {
    const { label, className } = props;

    return (
      <span
        className={cn(
          "inline-flex max-w-full min-w-0",
          QA_GAME.chipMaxWidth,
          getGradedTileClassName("missed"),
          className,
        )}
      >
        <span className="min-w-0 font-medium wrap-break-word">{label}</span>
      </span>
    );
  },
);
QASolutionPlacementChip.displayName = "QASolutionPlacementChip";
