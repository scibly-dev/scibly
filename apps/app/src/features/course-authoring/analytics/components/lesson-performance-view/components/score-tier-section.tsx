"use client";

import type { ScoreDistributionItem } from "../types";

import { cn } from "@scibly/ui/utils";
import { Search, X } from "lucide-react";
import React, { useMemo, useState } from "react";

import { type CoursesTranslations } from "@/features/course-authoring/contracts";

import { AnswerList } from "./score-tier-answer-list";

interface ScoreTierSectionProps {
  dist: ScoreDistributionItem;
  maxPoints: number;
  totalBlockAttempts: number;
  t: CoursesTranslations;
}

type TierAnswer = NonNullable<ScoreDistributionItem["answers"]>[number];

export function TierHeader({
  dist,
  hasAnswers,
  tierColor,
  t,
}: Pick<ScoreTierSectionProps, "dist" | "t"> & {
  hasAnswers: boolean;
  tierColor: string;
}) {
  const tierT = t.detail.analyticsTab;
  return (
    <div className="border-edge bg-ground-soft flex items-center justify-between border-b-2 px-3 py-1.5">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "rounded-full border-2 px-2 py-0.5 text-[10px] font-semibold",
            tierColor,
          )}
        >
          {tierT.scoreReached.replace(
            "{{points}}",
            String(dist.achievedPoints),
          )}
        </span>
        {!hasAnswers && (
          <span className="text-ink-soft text-[10px] italic">
            {tierT.noAnswerText}
          </span>
        )}
      </div>
      <div className="text-ink-soft flex items-center gap-2 text-[10px] font-semibold">
        {dist.enrolledCount > 0 && (
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            {dist.enrolledCount} {tierT.trendEnrolled.toLowerCase()}
          </span>
        )}
        {dist.anonCount > 0 && (
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
            {dist.anonCount} {tierT.trendAnonymous.toLowerCase()}
          </span>
        )}
      </div>
    </div>
  );
}

export function AnswerSearch({
  query,
  setQuery,
  t,
}: {
  query: string;
  setQuery: (query: string) => void;
  t: CoursesTranslations;
}) {
  return (
    <div className="border-edge bg-ground-soft relative flex items-center gap-2 border-b-2 px-3 py-1.5">
      <Search className="text-ink-soft absolute left-5 h-3.5 w-3.5 shrink-0" />
      <input
        type="text"
        placeholder={t.detail.analyticsTab.searchAnswers}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="placeholder:text-ink-soft/70 border-edge w-full rounded-lg border-2 bg-white py-1 pr-7 pl-7 text-[11px] transition-all outline-none focus:border-[#b9d7ff]"
      />
      {query && (
        <button
          onClick={() => setQuery("")}
          className="text-ink-soft/60 hover:text-ink absolute right-5 rounded-full p-0.5 transition-colors hover:bg-[#f7f9fd]"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// A question worth zero points can never be "correct" - without the
// maxPoints > 0 guard, 0/0 would read as a perfect score.
export function deriveTierState(achievedPoints: number, maxPoints: number) {
  return {
    isCorrect: maxPoints > 0 && achievedPoints === maxPoints,
    isZero: achievedPoints === 0,
  };
}

export function getTierColor(isCorrect: boolean, isZero: boolean) {
  if (isCorrect) {
    return "text-green-700 bg-green-50 border-green-200";
  }
  if (isZero) {
    return "text-red-700 bg-red-50 border-red-200";
  }
  return "text-amber-600 bg-amber-50 border-amber-200";
}

function displayedAnswers(
  answers: TierAnswer[],
  query: string,
  showAll: boolean,
) {
  if (query.trim() || showAll) return answers;
  return answers.slice(0, 5);
}

export function AnswerListToggle({
  answerCount,
  onToggle,
  showAll,
  t,
}: {
  answerCount: number;
  onToggle: () => void;
  showAll: boolean;
  t: CoursesTranslations;
}) {
  return (
    <div className="border-edge bg-ground-soft border-t-2 px-3 py-1.5 text-center">
      <button
        type="button"
        onClick={onToggle}
        className="text-ink-soft hover:text-ink hover:bg-ground rounded px-2 py-0.5 text-[10px] font-semibold transition-colors"
      >
        {showAll
          ? t.detail.analyticsTab.showLess
          : t.detail.analyticsTab.showAll.replace(
              "{{count}}",
              String(answerCount),
            )}
      </button>
    </div>
  );
}

export function ScoreTierSection({
  dist,
  maxPoints,
  totalBlockAttempts,
  t,
}: ScoreTierSectionProps) {
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { isCorrect, isZero } = deriveTierState(dist.achievedPoints, maxPoints);
  const hasAnswers = (dist.answers?.length ?? 0) > 0;
  const tierColor = getTierColor(isCorrect, isZero);

  const sortedAnswers = useMemo(() => {
    if (!dist.answers) return [];
    return [...dist.answers].sort(
      (a, b) => b.enrolledCount + b.anonCount - (a.enrolledCount + a.anonCount),
    );
  }, [dist.answers]);

  const filteredAnswers = useMemo(() => {
    if (!searchQuery.trim()) return sortedAnswers;
    const query = searchQuery.toLowerCase();
    return sortedAnswers.filter((ans) =>
      ans.answer.toLowerCase().includes(query),
    );
  }, [sortedAnswers, searchQuery]);

  const uniqueAnswersCount = dist.answers?.length ?? 0;
  const showSearch = uniqueAnswersCount > 8;
  const showToggle = uniqueAnswersCount > 5;

  const visibleAnswers = displayedAnswers(
    filteredAnswers,
    searchQuery,
    showAll,
  );

  return (
    <div className="border-edge max-w-2xl overflow-hidden rounded-2xl border-2 bg-white shadow-[0_2px_0_0_var(--color-lip)]">
      <TierHeader
        dist={dist}
        hasAnswers={Boolean(hasAnswers)}
        tierColor={tierColor}
        t={t}
      />
      {showSearch && (
        <AnswerSearch query={searchQuery} setQuery={setSearchQuery} t={t} />
      )}
      {hasAnswers && (
        <>
          <AnswerList
            answers={visibleAnswers}
            isCorrect={isCorrect}
            isZero={isZero}
            showAll={showAll}
            totalBlockAttempts={totalBlockAttempts}
            t={t}
          />
          {showToggle && !searchQuery.trim() && filteredAnswers.length > 5 && (
            <AnswerListToggle
              answerCount={uniqueAnswersCount}
              onToggle={() => setShowAll((previous) => !previous)}
              showAll={showAll}
              t={t}
            />
          )}
        </>
      )}
    </div>
  );
}
