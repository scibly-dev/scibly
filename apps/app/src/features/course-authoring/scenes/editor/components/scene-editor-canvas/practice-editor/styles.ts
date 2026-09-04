import { cardClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";

export const panelClass = cn(
  cardClass,
  "flex min-h-0 min-w-0 flex-col overflow-hidden dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none",
);

export const eyebrowClass =
  "text-ink-faint text-[11px] font-medium tracking-[0.15em] uppercase dark:text-neutral-500/80";
