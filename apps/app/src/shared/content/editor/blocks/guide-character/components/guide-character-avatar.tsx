"use client";

import type { GuideCharacterReaction } from "@/shared/content/editor/blocks/guide-character/utils/guide-character-reactions";

import { cn } from "@scibly/ui/utils";
import { useReducedMotion } from "framer-motion";

import { GuideCharacterLottie } from "@/shared/content/editor/blocks/guide-character/components/guide-character-lottie";

interface GuideCharacterAvatarProps {
  reaction: GuideCharacterReaction;
  animated?: boolean;
  className?: string;
  svgClassName?: string;
}

export function GuideCharacterAvatar({
  reaction,
  animated = true,
  className,
  svgClassName,
}: GuideCharacterAvatarProps) {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = animated && !prefersReducedMotion;

  return (
    <div
      className={cn("guide-character-avatar relative", className)}
      data-guide-reaction={reaction}
      aria-hidden
    >
      <div className="guide-character-avatar__inner">
        <GuideCharacterLottie
          reaction={reaction}
          animated={shouldAnimate}
          className={svgClassName}
        />
      </div>
    </div>
  );
}
