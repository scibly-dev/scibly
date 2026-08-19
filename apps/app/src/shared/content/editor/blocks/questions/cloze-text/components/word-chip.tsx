"use client";

import { cn } from "@scibly/ui/utils";
import { forwardRef, memo } from "react";

import { ClozeWordTile } from "@/shared/content/editor/blocks/questions/cloze-text/components/cloze-word-tile";
import { CLOZE_GAME } from "@/shared/content/editor/blocks/questions/cloze-text/utils/cloze-game-tokens";

type WordChipProps = {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "bank" | "placed" | "correct" | "incorrect" | "unused" | "missed";
  className?: string;
  isHidden?: boolean;
};

export const WordChip = memo(
  forwardRef<HTMLButtonElement, WordChipProps>((props, ref) => {
    const {
      label,
      onClick,
      disabled = false,
      variant = "bank",
      className,
      isHidden = false,
    } = props;

    const isInteractive = Boolean(onClick) && !disabled && !isHidden;

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || !onClick}
        onClick={onClick}
        className={cn(
          "inline-flex max-w-full items-center justify-center transition-transform duration-150",
          isInteractive && "cursor-pointer",
          isHidden && "pointer-events-none invisible",
          disabled && !isHidden && "cursor-default opacity-60",
          className,
        )}
      >
        <ClozeWordTile
          label={label}
          variant={variant === "bank" ? "default" : variant}
          className={cn(
            isInteractive && CLOZE_GAME.tileHover,
            isInteractive && CLOZE_GAME.tileActiveChip,
          )}
        />
      </button>
    );
  }),
);
WordChip.displayName = "WordChip";
