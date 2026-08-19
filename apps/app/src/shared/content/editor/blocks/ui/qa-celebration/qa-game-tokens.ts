import { QA_PRODUCT_TOKENS } from "@scibly/ui/product-tokens";
import { cn } from "@scibly/ui/utils";

import {
  getGradedTileClassName,
  type QAGradedItemStatus,
  type QAGradedTileSize,
  type QAGradedTileVariant,
} from "@/shared/content/editor/blocks/ui/qa-celebration/qa-celebration-tokens";

export const QA_GAME = {
  tileHover: "hover:brightness-[1.03]",

  tileActiveChip: "active:translate-y-[3px] active:!shadow-none active:mb-0",
  tileActiveOption: "active:translate-y-[4px] active:!shadow-none active:mb-0",

  slotEmpty: cn(
    "rounded-2xl border-2 border-dashed border-neutral-200 shadow-[inset_0_2px_3px_rgba(19,28,70,0.1)]",
    QA_PRODUCT_TOKENS.emptySlotSurface,
    "dark:border-neutral-800 dark:bg-neutral-800 dark:shadow-[inset_0_2px_3px_rgba(0,0,0,0.35)]",
  ),

  emptyGapTile:
    "mb-[3px] inline-flex min-w-[3.5rem] @min-[40rem]:min-w-[4.5rem] items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200/70 bg-neutral-100/50 px-3 py-2 text-[14px] @min-[40rem]:px-4 @min-[40rem]:py-2.5 @min-[40rem]:text-[15px] font-medium leading-snug shadow-[0_3px_0_0_var(--color-edge)] dark:border-neutral-800 dark:bg-neutral-900/40 dark:shadow-[0_3px_0_0_#404040]",
  slotTarget: "ring-2 ring-[#94c4ff]/60 ring-offset-2 dark:ring-blue-600/40",
  slotDropActive:
    "border-[#b9d7ff] border-b-[#94c4ff] bg-[#eff5ff] ring-2 ring-[#b9d7ff]/50 dark:border-blue-400/40 dark:border-b-blue-500/60 dark:bg-blue-950/30",
  slotDropReady:
    "border-dashed border-[#7ab4ff]/70 border-b-[#0066ff]/60 bg-[#eff5ff] dark:border-blue-500/35 dark:border-b-blue-600 dark:bg-blue-950/20",

  bankTray: cn(
    "rounded-2xl border-2 border-neutral-200/80 p-2 @min-[40rem]:p-3",
    QA_PRODUCT_TOKENS.bankSurface,
    "dark:border-neutral-800 dark:bg-neutral-950/40",
  ),
  bankShadow:
    "inline-flex rounded-2xl bg-neutral-300/80 dark:bg-neutral-700/80",
  bankLabel:
    "text-[11px] @min-[40rem]:text-[12px] font-bold tracking-[0.12em] @min-[40rem]:tracking-[0.14em] text-neutral-400 uppercase dark:text-neutral-500",

  chipMaxWidth: "max-w-[min(100%,17rem)]",

  panelRecessed:
    "rounded-2xl border-2 border-neutral-200 bg-ground-soft p-4 shadow-[inset_0_2px_4px_rgba(19,28,70,0.06)] dark:border-neutral-800 dark:bg-neutral-950/40 dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)]",
  panelInvalid:
    "border-red-300/80 border-b-red-400/90 bg-red-50/40 dark:border-red-900/50 dark:border-b-red-700",
  panelCorrect: cn(
    "mb-1 rounded-2xl border-2 p-4 shadow-[0_4px_0_0_#58a700]",
    QA_PRODUCT_TOKENS.submittedFace,
    "dark:border-green-700/50 dark:bg-green-950/25 dark:shadow-[0_4px_0_0_#3f6212]",
  ),
} as const;

export function gradedStatusToTileVariant(
  status: QAGradedItemStatus,
  isGraded: boolean,
): QAGradedTileVariant {
  if (!isGraded) return "default";

  switch (status) {
    case "correct":
      return "correct";
    case "incorrect":
      return "incorrect";
    case "missed":
      return "missed";
    case "neutral":
      return "unused";
    default:
      return "default";
  }
}

type QAGameTileClassNameOptions = {
  variant?: QAGradedTileVariant;
  gradedStatus?: QAGradedItemStatus;
  isGraded?: boolean;
  isSelected?: boolean;
  interactive?: boolean;
  size?: QAGradedTileSize;
  className?: string;
};

export function getQAGameTileClassName(
  options: QAGameTileClassNameOptions,
): string {
  const {
    variant: variantOverride,
    gradedStatus,
    isGraded = false,
    isSelected = false,
    interactive = false,
    size = "chip",
    className,
  } = options;

  let variant = variantOverride;
  if (!variant) {
    if (isGraded && gradedStatus !== undefined) {
      variant = gradedStatusToTileVariant(gradedStatus, true);
    } else if (isSelected) {
      variant = "selected";
    } else {
      variant = "default";
    }
  }

  return cn(
    getGradedTileClassName(variant, undefined, size),
    interactive && QA_GAME.tileHover,
    interactive &&
      (size === "option" ? QA_GAME.tileActiveOption : QA_GAME.tileActiveChip),
    className,
  );
}
