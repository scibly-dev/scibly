"use client";

import type { ReactNode } from "react";

import {
  motion,
  type Target,
  type Transition,
  useIsPresent,
} from "framer-motion";

import { EditorStoreScopeProvider } from "@/shared/content/editor/runtime/context/editor-store-scope-context";

type SceneAnimationVariant = {
  initial: Target;
  animate: Target;
  exit: Target;
  transition: Transition;
};

type LessonScenePanelProps = {
  variant: SceneAnimationVariant;
  children: ReactNode;
};

// AnimatePresence (mode isn't "wait") keeps an exiting scene's editor mounted
// during its exit animation; popped out of layout and hidden immediately so
// its stale TipTap UI can't bleed through the incoming scene.
export function LessonScenePanel({ variant, children }: LessonScenePanelProps) {
  const isPresent = useIsPresent();

  return (
    <motion.div
      aria-hidden={!isPresent}
      initial={variant.initial}
      animate={variant.animate}
      exit={variant.exit}
      transition={variant.transition}
      className="w-full py-2 @min-[48rem]:py-4"
      style={{
        position: isPresent ? "relative" : "absolute",
        top: isPresent ? undefined : 0,
        left: 0,
        right: 0,
        width: "100%",
        zIndex: isPresent ? 2 : 1,
        pointerEvents: isPresent ? "auto" : "none",
        visibility: isPresent ? "visible" : "hidden",
      }}
    >
      <EditorStoreScopeProvider active={isPresent}>
        {children}
      </EditorStoreScopeProvider>
    </motion.div>
  );
}
