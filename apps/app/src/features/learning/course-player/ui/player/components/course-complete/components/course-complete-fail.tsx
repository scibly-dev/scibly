"use client";

import type { LearningPlayerTranslations } from "../../../i18n/learning-player.types";

import { RotateCcw } from "lucide-react";

import { env } from "@/env";
import { useTranslation } from "@/i18n/hooks/use-translation";

import { CourseStatsCard } from "./course-stats-card";

interface CourseCompleteFailProps {
  courseTitle: string;
  achievedScorePct: number;
  requiredScorePct: number | null;
  triesCount: number;
  maxTries: number | null;
  onBackToDashboard?: () => void;
  backLabel?: string;
  onRestart?: () => void;
  isRestartPending?: boolean;
  showBranding?: boolean;
}

function retryInstruction(
  canRetry: boolean,
  hasRestart: boolean,
  t: LearningPlayerTranslations["courseCompleteFail"],
) {
  if (hasRestart) {
    return canRetry ? t.instructionRetry : t.instructionMaxTriesReached;
  }
  return canRetry
    ? t.instructionContactAdminRetry
    : t.instructionContactAdminMaxTriesReached;
}

export const FailureBranding = ({
  translations,
}: {
  translations: LearningPlayerTranslations;
}) => (
  <div className="mx-auto mt-4 flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50/50 p-5 text-center dark:border-neutral-800 dark:bg-neutral-900/30">
    <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
      {translations.branding.failTitle}
    </p>
    <p className="text-xs text-neutral-500 dark:text-neutral-400">
      {translations.branding.failDesc}
    </p>
    <a
      href={env.NEXT_PUBLIC_WEB_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-primary text-primary-foreground hover:bg-primary/95 inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
    >
      {translations.branding.failCta}
    </a>
  </div>
);

export const FailureStats = ({
  achievedScorePct,
  requiredScorePct,
  triesCount,
  maxTries,
  triesLeft,
  t,
}: Pick<
  CourseCompleteFailProps,
  "achievedScorePct" | "requiredScorePct" | "triesCount" | "maxTries"
> & {
  triesLeft: number | null;
  t: LearningPlayerTranslations["courseCompleteFail"];
}) => (
  <div className="flex w-full max-w-sm gap-3">
    {requiredScorePct !== null ? (
      <CourseStatsCard
        title={t.yourScore}
        value={
          <span className="text-3xl font-bold text-rose-500">
            {achievedScorePct}
          </span>
        }
        valueSuffix="%"
        footerLabel={t.required}
        footerValue={
          <span className="text-lg font-semibold text-neutral-600 dark:text-neutral-300">
            {requiredScorePct}%
          </span>
        }
      />
    ) : null}
    {maxTries !== null ? (
      <CourseStatsCard
        title={t.attemptsUsed}
        value={
          <span className="text-3xl font-bold text-neutral-700 dark:text-neutral-200">
            {triesCount}
          </span>
        }
        valueSuffix={`/ ${maxTries}`}
        footerLabel={t.remaining}
        footerValue={
          <span
            className={`text-lg font-semibold ${triesLeft === 0 ? "text-rose-500" : "text-emerald-600 dark:text-emerald-400"}`}
          >
            {triesLeft === 0
              ? t.remainingNone
              : t.remainingCount.replace("{{count}}", String(triesLeft))}
          </span>
        }
      />
    ) : null}
  </div>
);

export function CourseCompleteFail({
  courseTitle,
  achievedScorePct,
  requiredScorePct,
  triesCount,
  maxTries,
  onBackToDashboard,
  backLabel,
  onRestart,
  isRestartPending,
  showBranding = false,
}: CourseCompleteFailProps) {
  const { translations } = useTranslation("learningPlayer");
  const t = translations.courseCompleteFail;

  const triesLeft = maxTries !== null ? maxTries - triesCount : null;
  const canRetry = triesLeft === null || triesLeft > 0;

  return (
    <div className="flex min-h-[calc(65*var(--player-vh,1vh))] flex-1 flex-col items-center justify-center gap-10 py-12 text-center">
      <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-50 to-red-100 shadow-lg dark:from-rose-900/30 dark:to-red-900/30">
        <RotateCcw className="h-11 w-11 text-rose-400 dark:text-rose-500" />
      </div>

      <div className="flex max-w-sm flex-col gap-2">
        <p className="text-[13px] font-semibold tracking-widest text-rose-500 uppercase">
          {t.badge}
        </p>
        <h1 className="text-foreground text-3xl font-bold tracking-tight">
          {courseTitle}
        </h1>
        <p className="text-muted-foreground mt-1 text-[15px] leading-relaxed">
          {t.desc}
        </p>
      </div>

      <FailureStats
        achievedScorePct={achievedScorePct}
        requiredScorePct={requiredScorePct}
        triesCount={triesCount}
        maxTries={maxTries}
        triesLeft={triesLeft}
        t={t}
      />
      <p className="text-muted-foreground max-w-xs text-[13px] leading-relaxed">
        {retryInstruction(canRetry, Boolean(onRestart), t)}
      </p>

      <div className="flex gap-3 empty:hidden">
        {onBackToDashboard && (
          <button
            onClick={onBackToDashboard}
            className="rounded-xl border border-neutral-200 bg-white px-6 py-2.5 text-[13px] font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            {backLabel ?? t.backToDashboard}
          </button>
        )}
        {/* "Try Again" is only shown in self-service flows where the user can restart */}
        {onRestart && canRetry && (
          <button
            onClick={onRestart}
            disabled={isRestartPending}
            className="rounded-xl bg-rose-500 px-6 py-2.5 text-[13px] font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRestartPending ? t.resetting : t.tryAgain}
          </button>
        )}
      </div>

      {showBranding ? <FailureBranding translations={translations} /> : null}
    </div>
  );
}
