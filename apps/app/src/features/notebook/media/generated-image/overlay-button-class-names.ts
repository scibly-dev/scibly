import { cn } from "@scibly/ui/utils";

export const overlayButtonClassNames = {
  library: cn(
    "flex h-8 w-8 items-center justify-center rounded-full",
    "border border-white/60 bg-white/90 text-neutral-700 shadow-sm backdrop-blur-md",
    "transition-colors hover:bg-white",
    "dark:border-white/10 dark:bg-neutral-900/80 dark:text-neutral-200 dark:hover:bg-neutral-900",
  ),
  chat: cn(
    "flex h-9 w-9 items-center justify-center rounded-full",
    "border border-white/60 bg-white/85 text-neutral-700 shadow-sm backdrop-blur-md",
    "transition-colors hover:bg-white",
    "dark:border-white/10 dark:bg-neutral-900/75 dark:text-neutral-200 dark:hover:bg-neutral-900",
  ),
} as const;
