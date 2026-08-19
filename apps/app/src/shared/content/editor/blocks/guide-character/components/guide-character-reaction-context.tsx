"use client";

import type { GuideCharacterReaction } from "@/shared/content/editor/blocks/guide-character/utils/guide-character-reactions";

import { createContext, use } from "react";

const GuideCharacterReactionContext =
  createContext<GuideCharacterReaction>("idle");

export function GuideCharacterReactionProvider({
  reaction,
  children,
}: {
  reaction: GuideCharacterReaction;
  children: React.ReactNode;
}) {
  return (
    <GuideCharacterReactionContext value={reaction}>
      {children}
    </GuideCharacterReactionContext>
  );
}

export function useGuideCharacterSceneReaction(): GuideCharacterReaction {
  return use(GuideCharacterReactionContext);
}
