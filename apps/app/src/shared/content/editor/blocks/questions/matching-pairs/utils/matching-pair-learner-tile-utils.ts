import { cn } from "@scibly/ui/utils";

import {
  getQAGameTileClassName,
  type QAGradedItemStatus,
} from "@/shared/content/editor/blocks/ui/qa-celebration";

export const MATCHING_PAIR_TILE_MIN_HEIGHT_CLASS = "min-h-[3.25rem]";

export const SIDE_CONTENT_CLASS =
  "matching-pair-side-content pointer-events-none flex w-full min-w-0 flex-col items-center justify-center [&_.katex-display]:my-0 [&_p]:my-0";

export function displayTileGradedStatus(
  status: QAGradedItemStatus,
): QAGradedItemStatus {
  return status === "missed" ? "incorrect" : status;
}

export function matchingPairTileClassName({
  gradedStatus,
  isGraded,
  isSelected,
  interactive,
  showGradedColors,
  isMatched,
}: {
  gradedStatus: QAGradedItemStatus;
  isGraded: boolean;
  isSelected: boolean;
  interactive: boolean;
  showGradedColors: boolean;
  isMatched: boolean;
}) {
  return cn(
    "matching-pair-tile-shell matching-pair-tile-face matching-pair-side-tile flex h-full w-full min-w-0 flex-col items-center justify-center text-center",
    MATCHING_PAIR_TILE_MIN_HEIGHT_CLASS,
    getQAGameTileClassName({
      variant:
        isGraded &&
        showGradedColors &&
        displayTileGradedStatus(gradedStatus) === "neutral"
          ? "default"
          : undefined,
      gradedStatus: displayTileGradedStatus(gradedStatus),
      isGraded: isGraded && showGradedColors,
      isSelected,
      interactive,
      size: "option",
    }),
    interactive && "cursor-pointer",
    isMatched && !isGraded && "opacity-45",
  );
}
