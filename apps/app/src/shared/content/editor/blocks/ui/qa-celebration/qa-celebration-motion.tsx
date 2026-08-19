"use client";

import { cn } from "@scibly/ui/utils";
import { motion, useReducedMotion } from "framer-motion";
import { memo, type ReactNode } from "react";

import {
  QA_CELEBRATION_DURATION_MS,
  QA_CELEBRATION_JIGGLE,
  QA_CELEBRATION_POP,
  QA_CELEBRATION_STAGGER_MS,
  QA_GRADED_STYLES,
} from "@/shared/content/editor/blocks/ui/qa-celebration/qa-celebration-tokens";

type QACelebrationMotionProps = {
  children: ReactNode;
  celebrateKey?: number;
  enabled?: boolean;
  staggerIndex?: number;
  variant?: "jiggle" | "pop";
  block?: boolean;
  className?: string;
};

export const QACelebrationMotion = memo((props: QACelebrationMotionProps) => {
  const {
    children,
    celebrateKey = 0,
    enabled = false,
    staggerIndex = 0,
    variant = "jiggle",
    block = false,
    className,
  } = props;

  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = enabled && celebrateKey > 0 && !prefersReducedMotion;

  if (!shouldAnimate) {
    if (!className && !block) {
      return <>{children}</>;
    }

    if (block) {
      return <div className={className}>{children}</div>;
    }

    return <span className={className}>{children}</span>;
  }

  const isPop = variant === "pop";
  const motionKey = `qa-celebrate-${celebrateKey}-${staggerIndex}`;
  const motionProps = {
    className: cn(className),
    initial: { y: 0, x: 0, rotate: 0, scale: 1 },
    animate: isPop
      ? {
          scale: [...QA_CELEBRATION_POP.scale],
          y: [...QA_CELEBRATION_POP.y],
        }
      : {
          y: [...QA_CELEBRATION_JIGGLE.y],
          rotate: [...QA_CELEBRATION_JIGGLE.rotate],
          x: [...QA_CELEBRATION_JIGGLE.x],
        },
    transition: {
      delay: isPop ? 0 : staggerIndex * (QA_CELEBRATION_STAGGER_MS / 1000),
      duration: QA_CELEBRATION_DURATION_MS / 1000,
      times: isPop
        ? [...QA_CELEBRATION_POP.times]
        : [...QA_CELEBRATION_JIGGLE.times],
      ease: "easeOut" as const,
    },
  };

  if (block) {
    return (
      <motion.div key={motionKey} {...motionProps}>
        {children}
      </motion.div>
    );
  }

  return (
    <motion.span key={motionKey} {...motionProps}>
      {children}
    </motion.span>
  );
});
QACelebrationMotion.displayName = "QACelebrationMotion";

export function gradedItemClassName(
  status: "correct" | "incorrect" | "missed" | "neutral",
  baseClass: string,
): string {
  return cn(
    baseClass,
    status === "correct" && QA_GRADED_STYLES.correct,
    status === "incorrect" && QA_GRADED_STYLES.incorrect,
    status === "missed" && QA_GRADED_STYLES.missed,
  );
}
