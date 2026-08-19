"use client";

import type { QuestionBlockGradedState } from "@/shared/content/editor/assessment/grading/question-block-store/helpers";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export function useQACelebration(gradedState: QuestionBlockGradedState | null) {
  const prefersReducedMotion = useReducedMotion();
  const [celebrateKey, setCelebrateKey] = useState(0);
  const wasGradedRef = useRef(false);

  const isFullyCorrect = gradedState === "correct";
  const isPartial = gradedState === "partial";
  const isIncorrect = gradedState === "incorrect";
  const isGraded = isFullyCorrect || isPartial || isIncorrect;
  const hasPositiveResult = isFullyCorrect || isPartial;

  useEffect(() => {
    if (isGraded && !wasGradedRef.current && !prefersReducedMotion) {
      setCelebrateKey((current) => current + 1);
    }
    wasGradedRef.current = isGraded;
  }, [isGraded, prefersReducedMotion]);

  return {
    celebrateKey,
    isGraded,
    isFullyCorrect,
    isPartial,
    isIncorrect,
    hasPositiveResult,
  };
}
