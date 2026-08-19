import { cn } from "@scibly/ui/utils";

import { type CoursesTranslations } from "@/features/course-authoring/contracts";

import { type ScoreDistributionItem } from "../types";

type TierAnswer = NonNullable<ScoreDistributionItem["answers"]>[number];

export function AnswerRow({
  answer,
  isCorrect,
  isZero,
  percentage,
  t,
}: {
  answer: TierAnswer;
  isCorrect: boolean;
  isZero: boolean;
  percentage: number;
  t: CoursesTranslations;
}) {
  const tierT = t.detail.analyticsTab;
  return (
    <div className="hover:bg-ground-soft relative px-3 py-2 transition-colors">
      <div
        className={cn(
          "absolute inset-y-0 left-0 opacity-[0.06] transition-all duration-500",
          isCorrect ? "bg-green-500" : isZero ? "bg-red-500" : "bg-amber-500",
        )}
        style={{ width: `${percentage}%` }}
      />
      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-1.5">
          <span className="text-ink-faint mt-0.5 text-[11px] select-none">
            ↳
          </span>
          <p className="text-ink text-[11px] leading-relaxed font-medium break-words select-text">
            {answer.answer === "(empty)" ? (
              <span className="text-ink-soft font-normal italic">
                {tierT.emptyResponse}
              </span>
            ) : (
              answer.answer
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex items-center gap-1.5 text-[9px] tabular-nums">
            {answer.enrolledCount > 0 ? (
              <span className="rounded-full border border-blue-200 bg-blue-50 px-1.5 py-0.5 font-semibold text-blue-700">
                {answer.enrolledCount} {tierT.trendEnrolled.toLowerCase()}
              </span>
            ) : null}
            {answer.anonCount > 0 ? (
              <span className="rounded-full border border-purple-200 bg-purple-50 px-1.5 py-0.5 font-semibold text-purple-700">
                {answer.anonCount} {tierT.trendAnonymous.toLowerCase()}
              </span>
            ) : null}
          </div>
          <span className="text-ink-soft min-w-[28px] text-right text-[10px] font-bold">
            {percentage}%
          </span>
        </div>
      </div>
    </div>
  );
}

export function AnswerList({
  answers,
  isCorrect,
  isZero,
  showAll,
  totalBlockAttempts,
  t,
}: {
  answers: TierAnswer[];
  isCorrect: boolean;
  isZero: boolean;
  showAll: boolean;
  totalBlockAttempts: number;
  t: CoursesTranslations;
}) {
  if (answers.length === 0)
    return (
      <div className="text-ink-soft px-3 py-4 text-center text-[11px] italic">
        {t.detail.analyticsTab.noMatchingAnswers}
      </div>
    );
  return (
    <div
      className={cn(
        "divide-hairline divide-y",
        showAll && answers.length > 5 ? "max-h-[240px] overflow-y-auto" : "",
      )}
    >
      {answers.map((answer, index) => {
        const count = answer.enrolledCount + answer.anonCount;
        const percentage =
          totalBlockAttempts > 0
            ? Math.round((count / totalBlockAttempts) * 100)
            : 0;
        return (
          <AnswerRow
            key={index}
            answer={answer}
            isCorrect={isCorrect}
            isZero={isZero}
            percentage={percentage}
            t={t}
          />
        );
      })}
    </div>
  );
}
