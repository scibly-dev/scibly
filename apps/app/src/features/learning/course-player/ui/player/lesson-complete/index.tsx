"use client";

import { motion } from "framer-motion";
import { ChevronRight, Target, Zap } from "lucide-react";

import { useTranslation } from "@/i18n/hooks/use-translation";
import { GuideCharacterLottie } from "@/shared/content/editor/blocks/guide-character/components/guide-character-lottie";

import { COURSE_HIGHLIGHT } from "../course-overview/course-path-theme";
import { PLAYER_VIEWPORT_LAYER } from "../utils/viewport-layer";
import { LessonStatCard } from "./components/lesson-stat-card";
import { SpCollectOverlay } from "./components/sp-collect-overlay";
import {
  CELEBRATION_GOLD,
  SCORE_GREEN,
  SCORE_GREEN_DARK,
  useLessonComplete,
} from "./use-lesson-complete";

interface LessonCompleteProps {
  lessonTitle: string;
  spEarned: number;
  lessonMaxSp: number;
  nextLessonTitle?: string;
  onContinue: () => void;
}

export const CelebrationHero = ({
  title,
  subtitle,
  lessonTitle,
}: {
  title: string;
  subtitle: string;
  lessonTitle: string;
}) => {
  return (
    <>
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 26 }}
        className="relative mx-auto mb-6 h-44 w-44"
      >
        <GuideCharacterLottie
          reaction="celebrate"
          animated
          className="h-full w-full max-w-none"
        />
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 12, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          delay: 0.12,
          type: "spring",
          stiffness: 320,
          damping: 20,
        }}
        className="text-[2rem] leading-tight font-extrabold tracking-tight sm:text-[2.35rem]"
        style={{
          color: CELEBRATION_GOLD,
          textShadow: "0 2px 0 rgba(0,0,0,0.06)",
        }}
      >
        {title}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mx-auto mt-2 max-w-xs text-sm leading-relaxed font-medium text-neutral-500"
      >
        {subtitle}
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.24 }}
        className="mt-1 text-xs font-semibold tracking-[0.14em] text-neutral-400 uppercase"
      >
        {lessonTitle}
      </motion.p>
    </>
  );
};

export const CompletionStats = ({
  lessonMaxSp,
  visibleSP,
  animatedScorePct,
  isCollecting,
  spSourceRef,
  labels,
}: {
  lessonMaxSp: number;
  visibleSP: number;
  animatedScorePct: number;
  isCollecting: boolean;
  spSourceRef: React.RefObject<HTMLDivElement | null>;
  labels: { points: string; score: string };
}) => (
  <div
    className={`mt-8 flex gap-3 ${lessonMaxSp <= 0 ? "justify-center" : ""}`}
  >
    {lessonMaxSp > 0 ? (
      <div ref={spSourceRef} className="min-w-0 flex-1">
        <LessonStatCard
          label={labels.points}
          value={`+${visibleSP}`}
          icon={
            <Zap
              className="h-6 w-6 fill-current"
              style={{ color: CELEBRATION_GOLD }}
            />
          }
          accent={CELEBRATION_GOLD}
          accentDark="#E5B000"
          delay={0.32}
          dimmed={isCollecting}
        />
      </div>
    ) : (
      <div ref={spSourceRef} className="hidden" aria-hidden />
    )}
    <LessonStatCard
      label={labels.score}
      value={`${animatedScorePct}%`}
      icon={
        <Target
          className="h-6 w-6"
          style={{ color: SCORE_GREEN }}
          strokeWidth={2.5}
        />
      }
      accent={SCORE_GREEN}
      accentDark={SCORE_GREEN_DARK}
      delay={0.32}
      dimmed={isCollecting}
    />
  </div>
);

export const CompletionFooter = ({
  collecting,
  label,
  nextLessonTitle,
  nextLabel,
  onAction,
}: {
  collecting: boolean;
  label: string;
  nextLessonTitle?: string;
  nextLabel: string;
  onAction: () => void;
}) => (
  <div className="fixed inset-x-0 bottom-0 border-t border-neutral-100 bg-white px-6 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
    <div className="mx-auto w-full max-w-md">
      <motion.button
        type="button"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.48 }}
        whileHover={collecting ? undefined : { scale: 1.02 }}
        whileTap={collecting ? undefined : { scale: 0.98, y: 2 }}
        disabled={collecting}
        onClick={onAction}
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-extrabold tracking-wide text-white uppercase disabled:opacity-70"
        style={{
          backgroundColor: COURSE_HIGHLIGHT.primary,
          boxShadow: `0 4px 0 0 ${COURSE_HIGHLIGHT.primaryDark}`,
        }}
      >
        <span>{label}</span>
        <ChevronRight className="h-5 w-5" />
      </motion.button>
      {nextLessonTitle ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.54 }}
          className="mt-3 text-center text-sm text-neutral-500"
        >
          {nextLabel}{" "}
          <span className="font-semibold text-neutral-800">
            {nextLessonTitle}
          </span>
        </motion.p>
      ) : null}
    </div>
  </div>
);

export function LessonComplete({
  lessonTitle,
  spEarned,
  lessonMaxSp,
  nextLessonTitle,
  onContinue,
}: LessonCompleteProps) {
  const { translations: t } = useTranslation("learningPlayer");
  const {
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
  } = useLessonComplete({
    spEarned,
    lessonMaxSp,
    nextLessonTitle,
    onContinue,
    translations: t,
  });
  return (
    <motion.div
      {...PLAYER_VIEWPORT_LAYER}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-100 flex flex-col bg-white"
    >
      <motion.div
        animate={{
          opacity: isCollecting ? 0.45 : 1,
          scale: isCollecting ? 0.98 : 1,
        }}
        transition={{ duration: 0.25 }}
        className="flex flex-1 flex-col items-center justify-center px-6 pt-10 pb-36"
      >
        <div className="w-full max-w-md text-center">
          <CelebrationHero
            title={celebration.title}
            subtitle={celebration.subtitle}
            lessonTitle={lessonTitle}
          />
          <CompletionStats
            lessonMaxSp={lessonMaxSp}
            visibleSP={visibleSP}
            animatedScorePct={animatedScorePct}
            isCollecting={isCollecting}
            spSourceRef={spSourceRef}
            labels={{
              points: t.lessonComplete.sciblyPointsTotal,
              score: t.lessonComplete.scoreLabel,
            }}
          />
        </div>
      </motion.div>
      {shouldAnimateCollection ? (
        <SpCollectOverlay
          active={isCollecting}
          spAmount={spEarned}
          sourceRef={spSourceRef}
          onComplete={handleCollectComplete}
        />
      ) : null}
      <CompletionFooter
        collecting={isCollecting}
        label={primaryButtonLabel}
        nextLessonTitle={hasNextLesson ? nextLessonTitle : undefined}
        nextLabel={t.lessonComplete.nextLabel}
        onAction={handlePrimaryAction}
      />
    </motion.div>
  );
}
