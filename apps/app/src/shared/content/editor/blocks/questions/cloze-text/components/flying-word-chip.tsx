"use client";

import type { WordFlightPath } from "@/shared/content/editor/blocks/questions/cloze-text/utils/cloze-word-flight";

import { motion } from "framer-motion";
import { memo } from "react";
import { createPortal } from "react-dom";

import { ClozeWordTile } from "@/shared/content/editor/blocks/questions/cloze-text/components/cloze-word-tile";
import { WORD_FLIGHT_MS } from "@/shared/content/editor/blocks/questions/cloze-text/utils/cloze-game-tokens";

type FlyingWordChipProps = {
  label: string;
  flight: WordFlightPath;
  variant?: "default" | "correct";
  onComplete: () => void;
};

export const FlyingWordChip = memo((props: FlyingWordChipProps) => {
  const { label, flight, variant = "default", onComplete } = props;

  if (typeof document === "undefined") return null;

  return createPortal(
    <motion.div
      className="pointer-events-none fixed top-0 left-0 z-[9999] will-change-transform"
      initial={{
        x: flight.start.x,
        y: flight.start.y,
      }}
      animate={{
        x: flight.end.x,
        y: flight.end.y,
      }}
      transition={{
        type: "tween",
        duration: WORD_FLIGHT_MS / 1000,
        ease: [0.4, 0, 0.2, 1],
      }}
      onAnimationComplete={onComplete}
    >
      <div className="-translate-x-1/2 -translate-y-1/2">
        <ClozeWordTile
          label={label}
          variant={variant}
          truncate={false}
          className="shrink-0 shadow-[0_6px_18px_rgba(0,0,0,0.12)]"
        />
      </div>
    </motion.div>,
    document.body,
  );
});
FlyingWordChip.displayName = "FlyingWordChip";
