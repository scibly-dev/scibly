"use client";

import { cn } from "@scibly/ui/utils";
import { forwardRef, memo } from "react";

import { CLOZE_GAME } from "@/shared/content/editor/blocks/questions/cloze-text/utils/cloze-game-tokens";

type WordBankShadowProps = {
  label: string;
  className?: string;
};

export const WordBankShadow = memo(
  forwardRef<HTMLDivElement, WordBankShadowProps>((props, ref) => {
    const { label, className } = props;

    return (
      <div ref={ref} className={cn("inline-flex", className)} aria-hidden>
        <span className={CLOZE_GAME.bankShadow}>
          <span className="invisible mb-[3px] rounded-2xl border-2 border-transparent px-3 py-2 text-[14px] font-medium whitespace-nowrap @min-[40rem]:px-4 @min-[40rem]:py-2.5 @min-[40rem]:text-[15px]">
            {label || "…"}
          </span>
        </span>
      </div>
    );
  }),
);
WordBankShadow.displayName = "WordBankShadow";
