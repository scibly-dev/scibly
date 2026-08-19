import { cn } from "@scibly/ui/utils";

export const uxCardRowSurface = cn(
  "flex w-full items-start gap-3 rounded-xl px-4 py-3.5 text-left transition-colors",
  "hover:bg-ground dark:hover:bg-neutral-900/60",
);

export const uxCardRowSurfaceActive = "bg-ground dark:bg-neutral-900/60";

export const uxCardTitleInputClass = cn(
  "w-full bg-transparent text-[15px] leading-snug font-medium text-neutral-800 outline-none",
  "placeholder:text-neutral-400 dark:text-neutral-100 dark:placeholder:text-neutral-500",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

export const uxCardDetailInputClass = cn(
  "w-full resize-none bg-transparent text-[13px] leading-relaxed text-neutral-600 outline-none",
  "placeholder:text-neutral-400 dark:text-neutral-300 dark:placeholder:text-neutral-500",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

export const uxCardFeedbackInputClass = cn(
  "w-full resize-none rounded-xl border-2 px-3 py-2.5 text-[13px] leading-relaxed text-neutral-800 outline-none",
  "border-hairline bg-white placeholder:text-neutral-400",
  "focus:border-edge dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100",
  "dark:placeholder:text-neutral-500 dark:focus:border-neutral-700",
  "disabled:cursor-not-allowed disabled:opacity-50",
);
