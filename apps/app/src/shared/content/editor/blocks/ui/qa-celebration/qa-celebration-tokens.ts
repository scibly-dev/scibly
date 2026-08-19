import { QA_PRODUCT_TOKENS } from "@scibly/ui/product-tokens";
import { cn } from "@scibly/ui/utils";

import { objectKeys } from "@/lib/object-keys";

export const QA_GRADED_STYLES = {
  correct: cn(
    QA_PRODUCT_TOKENS.correctFace,
    "dark:border-green-700/50 dark:bg-green-950/30 dark:text-green-300",
  ),
  incorrect:
    "border-[#ffaaa7] bg-[#ffdfe0] text-[#ea2b2b] dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-300",
  missed:
    "border-[#ffce51] bg-[#fff8e6] text-[#c88700] dark:border-amber-700/45 dark:bg-amber-950/25 dark:text-amber-100",

  unused:
    "border-neutral-200 bg-neutral-100 text-neutral-400 opacity-80 dark:border-neutral-700/60 dark:bg-neutral-800/70 dark:text-neutral-500",

  correctInline: cn(
    QA_PRODUCT_TOKENS.correctFace,
    "dark:border-green-700/50 dark:bg-green-950/35 dark:text-green-300",
  ),
  incorrectInline:
    "border-[#ffaaa7] bg-[#ffdfe0] text-[#ea2b2b] dark:border-red-800/50 dark:bg-red-950/35 dark:text-red-300",
  submitted: cn(
    QA_PRODUCT_TOKENS.submittedFace,
    "dark:border-green-800/40 dark:bg-green-950/20",
  ),
} as const;

export const QA_CELEBRATION_STAGGER_MS = 110;
export const QA_CELEBRATION_DURATION_MS = 540;
export const QA_CELEBRATION_BOUNCE_PX = 18;

export const QA_CELEBRATION_JIGGLE = {
  y: [
    0,
    -QA_CELEBRATION_BOUNCE_PX,
    -QA_CELEBRATION_BOUNCE_PX,
    -QA_CELEBRATION_BOUNCE_PX,
    -6,
    0,
  ],
  rotate: [0, 0, -7, 7, -4, 0],
  x: [0, 0, -2, 2, -1, 0],
  times: [0, 0.22, 0.38, 0.54, 0.78, 1],
} as const;

export const QA_CELEBRATION_POP = {
  scale: [1, 1.045, 0.995, 1],
  y: [0, -5, 0, 0],
  times: [0, 0.35, 0.65, 1],
} as const;

const QA_3D_CHIP_BASE =
  "rounded-2xl border-2 px-3 py-2 text-[14px] @min-[40rem]:px-4 @min-[40rem]:py-2.5 @min-[40rem]:text-[15px] font-medium leading-snug transition-[transform,box-shadow,margin-bottom,filter] duration-100 ease-out";

const QA_3D_OPTION_BASE =
  "rounded-2xl border-2 px-4 py-3 text-[16px] @min-[40rem]:px-5 @min-[40rem]:py-4 @min-[40rem]:text-[17px] font-medium leading-snug transition-[transform,box-shadow,margin-bottom,filter] duration-100 ease-out";

const QA_3D_SIZE_BASE = {
  chip: QA_3D_CHIP_BASE,
  option: QA_3D_OPTION_BASE,
} as const;

const QA_3D_FACE = {
  default: cn(
    "border-neutral-200 bg-white text-neutral-700",
    "dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100",
  ),
  placed: cn(
    "border-neutral-200 bg-white text-neutral-700",
    "dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100",
  ),

  selected: cn(
    "border-[#b9d7ff] bg-[#eff5ff] text-[#0b4fb0]",
    "dark:border-blue-400/40 dark:bg-blue-950/30 dark:text-sky-300",
  ),
  correct: cn(
    QA_PRODUCT_TOKENS.correctFace,
    "dark:border-green-600/55 dark:bg-green-950/35 dark:text-green-300",
  ),
  incorrect: cn(
    "border-[#ffaaa7] bg-[#ffdfe0] text-[#ea2b2b]",
    "dark:border-red-700/55 dark:bg-red-950/35 dark:text-red-300",
  ),
  unused: cn(
    "border-neutral-200 bg-neutral-100 text-neutral-400 opacity-80",
    "dark:border-neutral-700 dark:bg-neutral-800/80 dark:text-neutral-500",
  ),
  missed: cn(
    "border-[#ffce51] bg-[#fff8e6] text-[#c88700]",
    "dark:border-amber-600/55 dark:bg-amber-950/30 dark:text-amber-200",
  ),
} as const;

const QA_3D_LIP_CHIP = {
  default:
    "mb-[3px] shadow-[0_3px_0_0_var(--color-edge)] dark:shadow-[0_3px_0_0_#404040]",
  placed:
    "mb-[3px] shadow-[0_3px_0_0_var(--color-edge)] dark:shadow-[0_3px_0_0_#404040]",
  selected:
    "mb-[3px] shadow-[0_3px_0_0_#94c4ff] dark:shadow-[0_3px_0_0_#3b82f6]",
  correct:
    "mb-[3px] shadow-[0_3px_0_0_#58a700] dark:shadow-[0_3px_0_0_#3f6212]",
  incorrect:
    "mb-[3px] shadow-[0_3px_0_0_#ea2b2b] dark:shadow-[0_3px_0_0_#991b1b]",
  unused:
    "mb-[3px] shadow-[0_3px_0_0_var(--color-edge)] dark:shadow-[0_3px_0_0_#404040]",
  missed: "mb-[3px] shadow-[0_3px_0_0_#ffc800] dark:shadow-[0_3px_0_0_#b45309]",
} as const;

const QA_3D_LIP_OPTION = {
  default:
    "mb-1 shadow-[0_4px_0_0_var(--color-edge)] dark:shadow-[0_4px_0_0_#404040]",
  placed:
    "mb-1 shadow-[0_4px_0_0_var(--color-edge)] dark:shadow-[0_4px_0_0_#404040]",
  selected: "mb-1 shadow-[0_4px_0_0_#94c4ff] dark:shadow-[0_4px_0_0_#3b82f6]",
  correct: "mb-1 shadow-[0_4px_0_0_#58a700] dark:shadow-[0_4px_0_0_#3f6212]",
  incorrect: "mb-1 shadow-[0_4px_0_0_#ea2b2b] dark:shadow-[0_4px_0_0_#991b1b]",
  unused:
    "mb-1 shadow-[0_4px_0_0_var(--color-edge)] dark:shadow-[0_4px_0_0_#404040]",
  missed: "mb-1 shadow-[0_4px_0_0_#ffc800] dark:shadow-[0_4px_0_0_#b45309]",
} as const;

export type QAGradedTileVariant = keyof typeof QA_3D_FACE;
export type QAGradedTileSize = keyof typeof QA_3D_SIZE_BASE;

// SAFETY: one entry per key of `QA_3D_FACE`, which is what
// `QAGradedTileVariant` is the union of.
export const QA_GRADED_TILE_STYLES = Object.fromEntries(
  objectKeys(QA_3D_FACE).map((variant) => [
    variant,
    cn(QA_3D_CHIP_BASE, QA_3D_FACE[variant], QA_3D_LIP_CHIP[variant]),
  ]),
) as Record<QAGradedTileVariant, string>;

export function getGradedTileClassName(
  variant: QAGradedTileVariant,
  className?: string,
  size: QAGradedTileSize = "chip",
) {
  const lip = size === "option" ? QA_3D_LIP_OPTION : QA_3D_LIP_CHIP;

  return cn(
    QA_3D_SIZE_BASE[size],
    QA_3D_FACE[variant],
    lip[variant],
    className,
  );
}

export type QAGradedItemStatus = "correct" | "incorrect" | "missed" | "neutral";

export function getChoiceGradedStatus(
  choiceId: string,
  correctChoiceIds: string[],
  userAnswers: string[],
  isGraded: boolean,
): QAGradedItemStatus {
  if (!isGraded) return "neutral";

  const isCorrectChoice = correctChoiceIds.includes(choiceId);
  const isSelected = userAnswers.includes(choiceId);

  if (isCorrectChoice && isSelected) return "correct";
  if (!isCorrectChoice && isSelected) return "incorrect";
  if (isCorrectChoice && !isSelected) return "missed";
  return "neutral";
}

export function getMappingGradedStatus(
  correctZoneId: string | undefined,
  userZoneId: string | undefined,
  isGraded: boolean,
): QAGradedItemStatus {
  if (!isGraded || !correctZoneId) return "neutral";
  if (!userZoneId) return "missed";
  return userZoneId === correctZoneId ? "correct" : "incorrect";
}

export function getGapGradedStatus(
  correctItemId: string,
  placedItemId: string | undefined,
  isGraded: boolean,
): QAGradedItemStatus {
  if (!isGraded) return "neutral";
  if (!placedItemId) return "missed";
  if (placedItemId === correctItemId) return "correct";
  return "incorrect";
}

export function getClozeBankItemStatus(
  itemId: string,
  correctItemIds: ReadonlySet<string>,
  isGraded: boolean,
): QAGradedItemStatus {
  if (!isGraded) return "neutral";
  return correctItemIds.has(itemId) ? "missed" : "neutral";
}
