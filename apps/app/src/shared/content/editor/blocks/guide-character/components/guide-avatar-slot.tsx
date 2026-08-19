import type { GuideCharacterReaction } from "@/shared/content/editor/blocks/guide-character/utils/guide-character-reactions";
import type { GuideLayoutId } from "@/shared/content/editor/blocks/guide-character/utils/guide-layouts";

import { cn } from "@scibly/ui/utils";

import { GuideCharacterAvatar } from "@/shared/content/editor/blocks/guide-character/components/guide-character-avatar";

interface GuideAvatarSlotProps {
  layout: GuideLayoutId;
  reaction: GuideCharacterReaction;
  animated: boolean;
}

export function GuideAvatarSlot({
  layout,
  reaction,
  animated,
}: GuideAvatarSlotProps) {
  return (
    <div
      className={cn(
        "not-draggable pointer-events-none shrink-0 select-none",
        layout === "inline" && "absolute top-3 left-3 z-10",
        layout === "top" && "mx-auto max-w-[8rem]",
      )}
    >
      <GuideCharacterAvatar
        reaction={reaction}
        animated={animated}
        className={layout === "top" ? "mx-auto max-w-[8rem]" : undefined}
        svgClassName={cn(layout === "inline" ? "max-w-[3.25rem]" : undefined)}
      />
    </div>
  );
}
