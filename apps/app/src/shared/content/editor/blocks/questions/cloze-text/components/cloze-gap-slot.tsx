"use client";

import type { QAGradedItemStatus } from "@/shared/content/editor/blocks/ui/qa-celebration";

import { cn } from "@scibly/ui/utils";
import { motion } from "framer-motion";
import { forwardRef, memo } from "react";

import { WordChip } from "@/shared/content/editor/blocks/questions/cloze-text/components/word-chip";
import {
  CLOZE_GAME,
  WORD_FLIGHT_MS,
} from "@/shared/content/editor/blocks/questions/cloze-text/utils/cloze-game-tokens";
import { QACelebrationMotion } from "@/shared/content/editor/blocks/ui/qa-celebration";

const GAP_INLINE_WRAPPER = "mx-1 inline-flex items-baseline";

type ClozeGapSlotProps = {
  gapId: string;
  label?: string;
  solutionLabel?: string;
  onClick?: () => void;
  disabled?: boolean;
  isFilled?: boolean;
  gradedStatus?: QAGradedItemStatus;
  isHidden?: boolean;

  incomingLabel?: string;

  bounceIndex?: number;

  celebrateKey?: number;
  celebrateFullBlock?: boolean;
};

export const ClozeGapSlot = memo(
  forwardRef<HTMLSpanElement, ClozeGapSlotProps>((props, ref) => {
    const {
      gapId,
      label,
      solutionLabel,
      onClick,
      disabled = false,
      isFilled = false,
      gradedStatus = "neutral",
      isHidden = false,
      incomingLabel,
      bounceIndex = 0,
      celebrateKey = 0,
      celebrateFullBlock = false,
    } = props;

    const shouldCelebrate =
      celebrateFullBlock && gradedStatus === "correct" && celebrateKey > 0;

    if (gradedStatus === "missed" && solutionLabel && !isHidden) {
      return (
        <span ref={ref} data-gap-id={gapId} className={GAP_INLINE_WRAPPER}>
          <WordChip label={solutionLabel} disabled variant="missed" />
        </span>
      );
    }

    if (isFilled && label && isHidden) {
      return (
        <span
          ref={ref}
          data-gap-id={gapId}
          className={GAP_INLINE_WRAPPER}
          aria-hidden
        >
          <WordChip label={label} disabled className="invisible" />
        </span>
      );
    }

    if (isFilled && label) {
      const tileVariant =
        gradedStatus === "correct"
          ? "correct"
          : gradedStatus === "incorrect"
            ? "incorrect"
            : "placed";

      return (
        <span
          ref={ref}
          data-gap-id={gapId}
          className={cn(GAP_INLINE_WRAPPER, "gap-1")}
        >
          <QACelebrationMotion
            celebrateKey={celebrateKey}
            enabled={shouldCelebrate}
            staggerIndex={bounceIndex}
          >
            <WordChip
              label={label}
              onClick={onClick}
              disabled={disabled}
              variant={tileVariant}
            />
          </QACelebrationMotion>
          {gradedStatus === "incorrect" && solutionLabel ? (
            <WordChip label={solutionLabel} disabled variant="missed" />
          ) : null}
        </span>
      );
    }

    const sizeLabel = incomingLabel ?? "\u00a0";

    return (
      <span
        ref={ref}
        data-gap-id={gapId}
        className={cn(GAP_INLINE_WRAPPER, isHidden && "invisible")}
        aria-hidden={!isFilled}
      >
        <motion.span
          layout="size"
          transition={{
            layout: {
              duration: WORD_FLIGHT_MS / 1000,
              ease: [0.4, 0, 0.2, 1],
            },
          }}
          className={CLOZE_GAME.emptyGapTile}
        >
          {incomingLabel ? (
            <span
              className="invisible whitespace-nowrap select-none"
              aria-hidden
            >
              {incomingLabel}
            </span>
          ) : (
            <span className="invisible select-none" aria-hidden>
              {sizeLabel}
            </span>
          )}
        </motion.span>
      </span>
    );
  }),
);
ClozeGapSlot.displayName = "ClozeGapSlot";
