"use client";

import { useCallback, useEffect, useRef } from "react";

import { computeScorePct } from "../../../../../progression/progression-rules";

export function useCompletionRestore({
  isProgressLoading,
  status,
  totalSP,
  courseMaxSP,
  hasCertificate,
  onRestoreCourseComplete,
}: {
  isProgressLoading: boolean;
  status: string | undefined;
  totalSP: number | undefined;
  courseMaxSP: number;
  hasCertificate: boolean;
  onRestoreCourseComplete: (finalScorePct: number) => void;
}) {
  const hasRestoredCompleteRef = useRef(false);

  useEffect(() => {
    if (isProgressLoading || hasRestoredCompleteRef.current) return;
    hasRestoredCompleteRef.current = true;
    if (status !== "COMPLETED" || hasCertificate) return;

    const finalScorePct = computeScorePct(totalSP ?? 0, courseMaxSP);
    Promise.resolve().then(() => {
      onRestoreCourseComplete(finalScorePct);
    });
  }, [
    isProgressLoading,
    status,
    totalSP,
    courseMaxSP,
    hasCertificate,
    onRestoreCourseComplete,
  ]);

  return useCallback(() => {
    hasRestoredCompleteRef.current = false;
  }, []);
}
