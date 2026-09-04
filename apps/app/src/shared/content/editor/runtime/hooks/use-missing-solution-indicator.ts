"use client";

import type { QuestionBlocksType } from "@/shared/content/editor/blocks/registry/shared";

import { useEffect, useRef, useState } from "react";
import isEqual from "react-fast-compare";
import { useDebouncedCallback } from "use-debounce";

import { questionBlockParserRegistry } from "@/shared/content/editor/assessment/parsing/parser-registry";

const SETTLE_MS = 800;

type MissingSolutionIndicator<Q> = {
  blockType: QuestionBlocksType;
  questionData: Q;

  isAuthoring: boolean;
};

// Mirrors the publish-time refusal message but never blocks publishing itself.
export function useMissingSolutionIndicator<Q>({
  blockType,
  questionData,
  isAuthoring,
}: MissingSolutionIndicator<Q>): string | null {
  const [reason, setReason] = useState<string | null>(null);

  const initialQuestionData = useRef(questionData);
  const hasBeenEdited = useRef(false);

  const settle = useDebouncedCallback((data: Q) => {
    setReason(
      questionBlockParserRegistry.describeMissingSolution(blockType, data),
    );
  }, SETTLE_MS);

  useEffect(() => {
    if (!isAuthoring) {
      settle.cancel();
      return;
    }
    if (!hasBeenEdited.current) {
      if (isEqual(questionData, initialQuestionData.current)) return;
      hasBeenEdited.current = true;
    }
    settle(questionData);
  }, [isAuthoring, questionData, settle]);

  return isAuthoring ? reason : null;
}
