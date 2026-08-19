"use client";

import type { LearningPlayerTranslations } from "../i18n/learning-player.types";

import confetti from "canvas-confetti";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { computeScorePct } from "@/features/learning/progression/progression-rules";

import { COURSE_HIGHLIGHT } from "../course-overview/course-path-theme";
import { playLessonCompleteSound } from "../lesson-player/utils/player-sfx";

export const CELEBRATION_GOLD = "#FFC800";
export const SCORE_GREEN = "#58CC02";
export const SCORE_GREEN_DARK = "#46A302";

function getCelebrationCopy(
  scorePct: number,
  translations: LearningPlayerTranslations["lessonComplete"],
) {
  if (scorePct >= 100) {
    return {
      title: translations.titlePerfect,
      subtitle: translations.subtitlePerfect,
    };
  }
  if (scorePct >= 80) {
    return {
      title: translations.titleGreat,
      subtitle: translations.subtitleGreat,
    };
  }
  return {
    title: translations.titleDone,
    subtitle: translations.subtitleDone,
  };
}

function burstConfetti(particleCount: number, spread: number, y: number) {
  confetti({
    particleCount,
    spread,
    origin: { y },
    colors: [
      CELEBRATION_GOLD,
      COURSE_HIGHLIGHT.primary,
      "#ffffff",
      SCORE_GREEN,
    ],
  });
}

function useCollectionCountdown(
  active: boolean,
  spEarned: number,
  setDisplaySP: (value: number) => void,
) {
  useEffect(() => {
    if (!active) return;
    const startedAt = Date.now();
    let rafId = 0;
    const tick = () => {
      const progress = Math.min((Date.now() - startedAt) / 1400, 1);
      setDisplaySP(Math.max(0, Math.round(spEarned * (1 - progress))));
      if (progress < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [active, spEarned, setDisplaySP]);
}

function useScoreCelebration(
  spEarned: number,
  scorePct: number,
  setAnimatedSP: (value: number) => void,
  setAnimatedScorePct: (value: number) => void,
) {
  useEffect(() => {
    let cancelled = false;
    const animationFrames: number[] = [];
    playLessonCompleteSound();
    burstConfetti(80, 70, 0.55);
    window.setTimeout(() => burstConfetti(50, 100, 0.35), 180);
    window.setTimeout(() => burstConfetti(40, 60, 0.7), 360);
    const animateValue = (
      target: number,
      duration: number,
      delay: number,
      setter: (value: number) => void,
    ) => {
      const startAt = Date.now() + delay;
      const tick = () => {
        if (cancelled) return;
        const elapsed = Date.now() - startAt;
        if (elapsed < 0) {
          animationFrames.push(requestAnimationFrame(tick));
          return;
        }
        const progress = Math.min(elapsed / duration, 1);
        setter(Math.round((1 - Math.pow(1 - progress, 3)) * target));
        if (progress < 1) animationFrames.push(requestAnimationFrame(tick));
      };
      animationFrames.push(requestAnimationFrame(tick));
    };
    animateValue(spEarned, 900, 400, setAnimatedSP);
    animateValue(scorePct, 700, 520, setAnimatedScorePct);
    return () => {
      cancelled = true;
      animationFrames.forEach(cancelAnimationFrame);
    };
  }, [spEarned, scorePct, setAnimatedSP, setAnimatedScorePct]);
}

export function useLessonComplete({
  spEarned,
  lessonMaxSp,
  nextLessonTitle,
  onContinue,
  translations,
}: {
  spEarned: number;
  lessonMaxSp: number;
  nextLessonTitle?: string;
  onContinue: () => void;
  translations: LearningPlayerTranslations;
}) {
  const [animatedSP, setAnimatedSP] = useState(0);
  const [animatedScorePct, setAnimatedScorePct] = useState(0);
  const [isCollecting, setIsCollecting] = useState(false);
  const [displaySP, setDisplaySP] = useState<number | null>(null);
  const spSourceRef = useRef<HTMLDivElement>(null);
  const onContinueRef = useRef(onContinue);

  useEffect(() => {
    onContinueRef.current = onContinue;
  }, [onContinue]);

  const scorePct = Math.min(100, computeScorePct(spEarned, lessonMaxSp));
  const celebration = useMemo(
    () => getCelebrationCopy(scorePct, translations.lessonComplete),
    [scorePct, translations.lessonComplete],
  );
  const hasNextLesson = Boolean(nextLessonTitle);
  const shouldAnimateCollection = spEarned > 0 && lessonMaxSp > 0;
  const visibleSP = displaySP ?? animatedSP;
  const primaryButtonLabel = shouldAnimateCollection
    ? translations.lessonComplete.claimSciblyPoints
    : !hasNextLesson
      ? translations.lessonComplete.courseCompleted
      : translations.lessonComplete.continueOnPath;

  const handleCollectComplete = useCallback(() => {
    onContinueRef.current();
  }, []);

  const handlePrimaryAction = () => {
    if (isCollecting) return;
    if (shouldAnimateCollection) {
      setDisplaySP(spEarned);
      setIsCollecting(true);
      return;
    }
    onContinueRef.current();
  };
  useCollectionCountdown(
    isCollecting && shouldAnimateCollection,
    spEarned,
    setDisplaySP,
  );
  useScoreCelebration(spEarned, scorePct, setAnimatedSP, setAnimatedScorePct);

  return {
    animatedScorePct,
    celebration,
    handleCollectComplete,
    handlePrimaryAction,
    hasNextLesson,
    isCollecting,
    primaryButtonLabel,
    shouldAnimateCollection,
    spSourceRef,
    visibleSP,
  };
}
