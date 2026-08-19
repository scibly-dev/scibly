"use client";

import { motion } from "framer-motion";
import { Check, Crown, Star } from "lucide-react";

import { COURSE_HIGHLIGHT } from "../course-path-theme";

export type SceneNodeStatus = "completed" | "current" | "upcoming";

interface ScenePathNodeProps {
  offsetX: number;
  status: SceneNodeStatus;

  isFinal: boolean;

  onStart?: () => void;
  label: string;
}

const SCENE_NODE_SIZE_PX = 56;
const CURRENT_SCENE_NODE_SIZE_PX = 64;

const NODE_LIP_PX = 8;

function nodeVisuals(status: SceneNodeStatus) {
  const [face, lip, glyph] =
    status === "completed"
      ? [COURSE_HIGHLIGHT.completed, COURSE_HIGHLIGHT.completedLip, "#ffffff"]
      : status === "current"
        ? [COURSE_HIGHLIGHT.nextFace, COURSE_HIGHLIGHT.nextLip, "#ffffff"]
        : [
            COURSE_HIGHLIGHT.locked,
            COURSE_HIGHLIGHT.lockedLip,
            COURSE_HIGHLIGHT.lockedIcon,
          ];
  return {
    backgroundColor: face,
    color: glyph,
    boxShadow: `0 ${NODE_LIP_PX}px 0 0 ${lip}, inset 0 3px 0 0 rgba(255,255,255,0.28)`,
  };
}

const CURRENT_PULSE = {
  animate: {
    boxShadow: [
      `0 ${NODE_LIP_PX}px 0 0 ${COURSE_HIGHLIGHT.nextLip}, 0 0 0 0 ${COURSE_HIGHLIGHT.primaryGlow}`,
      `0 ${NODE_LIP_PX}px 0 0 ${COURSE_HIGHLIGHT.nextLip}, 0 0 0 13px transparent`,
    ],
  },
  transition: { duration: 1.8, repeat: Infinity, ease: "easeOut" as const },
};

const NodeGlyph = ({
  status,
  isFinal,
}: {
  status: SceneNodeStatus;
  isFinal: boolean;
}) => {
  if (status === "completed") {
    return <Check className="size-7" strokeWidth={3.25} />;
  }
  if (isFinal) {
    return <Crown className="size-7" strokeWidth={2.5} fill="currentColor" />;
  }
  return <Star className="size-7" strokeWidth={2.5} fill="currentColor" />;
};

export function ScenePathNode({
  offsetX,
  status,
  isFinal,
  onStart,
  label,
}: ScenePathNodeProps) {
  const visuals = nodeVisuals(status);
  const size =
    status === "current" ? CURRENT_SCENE_NODE_SIZE_PX : SCENE_NODE_SIZE_PX;
  const pulse = status === "current" ? CURRENT_PULSE : undefined;
  return (
    <div style={{ transform: `translateX(${offsetX}px)` }}>
      <motion.button
        type="button"
        disabled={!onStart}
        onClick={onStart}
        whileHover={onStart ? { y: -2 } : undefined}
        whileTap={onStart ? { y: NODE_LIP_PX - 2 } : undefined}
        animate={pulse?.animate}
        transition={pulse?.transition}
        className="flex shrink-0 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none enabled:cursor-pointer disabled:cursor-default"
        style={{ width: size, height: size, ...visuals }}
        aria-label={label}
      >
        <NodeGlyph status={status} isFinal={isFinal} />
      </motion.button>
    </div>
  );
}
