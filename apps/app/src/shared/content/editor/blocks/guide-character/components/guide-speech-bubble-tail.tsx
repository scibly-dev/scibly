import type { GuideLayoutId } from "@/shared/content/editor/blocks/guide-character/utils/guide-layouts";

import { cn } from "@scibly/ui/utils";

interface GuideSpeechBubbleTailProps {
  layout: GuideLayoutId;
}

export function GuideSpeechBubbleTail({ layout }: GuideSpeechBubbleTailProps) {
  if (layout === "inline") return null;

  return (
    <div
      className={cn(
        "guide-speech-tail border-hairline pointer-events-none absolute h-4 w-4 rotate-45 bg-white dark:border-neutral-700/80 dark:bg-neutral-900",
        layout === "left" && "bottom-6 -left-[9px] border-b-2 border-l-2",
        layout === "right" && "-right-[9px] bottom-6 border-t-2 border-r-2",
        layout === "top" &&
          "-top-[9px] left-1/2 -translate-x-1/2 border-t-2 border-l-2",
      )}
      aria-hidden
    />
  );
}
