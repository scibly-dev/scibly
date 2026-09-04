"use client";

import type { RouterOutputs } from "@/shared/api/trpc/client";

import { cn } from "@scibly/ui/utils";
import { Check, Loader2, X } from "lucide-react";

import { useTranslation } from "@/i18n/hooks/use-translation";
import { isFieldCorrect } from "@/shared/content/practice/grade-practice-submission";

import { eyebrowClass } from "./styles";

type GradingResult = RouterOutputs["scene"]["validatePractice"];

export function GradingReport({
  result,
  isPending,
  isError,
}: {
  result: GradingResult | undefined;
  isPending: boolean;
  isError: boolean;
}) {
  const { translations } = useTranslation("editorUi");
  const copy = translations.practice;

  if (isPending) {
    return (
      <p className="text-ink-soft flex shrink-0 items-center gap-2 text-[12px]">
        <Loader2 className="size-3.5 animate-spin" />
        {copy.grading}
      </p>
    );
  }

  if (isError) {
    return (
      <p
        role="alert"
        className="shrink-0 rounded-xl border-2 border-red-200 px-4 py-5 text-center text-[12px] font-medium text-red-600"
      >
        {copy.gradingFailed}
      </p>
    );
  }

  if (!result) {
    return (
      <p className="border-hairline text-ink-faint shrink-0 rounded-xl border-2 border-dashed px-4 py-5 text-center text-[12px] dark:border-neutral-800">
        {copy.gradingEmpty}
      </p>
    );
  }

  return (
    <div className="border-hairline shrink-0 rounded-xl border-2 dark:border-neutral-800">
      <div className="border-hairline flex items-center justify-between border-b-2 px-4 py-2.5 dark:border-neutral-800">
        <span className={eyebrowClass}>{copy.result}</span>
        <span className="text-ink text-[13px] font-bold tabular-nums">
          {result.totalSpEarned} SP
        </span>
      </div>
      <div className="space-y-2 px-4 py-3">
        {result.gradedFields.length === 0 ? (
          <p className="text-ink-soft text-[12px]">{copy.ungradedScene}</p>
        ) : (
          <ul className="space-y-2">
            {result.gradedFields.map((field) => {
              const correct = isFieldCorrect(field);
              return (
                <li key={field.blockId} className="flex items-start gap-2.5">
                  <span
                    className={cn(
                      "mt-px flex size-5 shrink-0 items-center justify-center rounded-full",
                      correct
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-600",
                    )}
                  >
                    {correct ? (
                      <Check className="size-3" strokeWidth={3} />
                    ) : (
                      <X className="size-3" strokeWidth={3} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <code className="text-ink font-mono text-[12px]">
                      {field.blockId}
                    </code>
                    {correct || field.correctAnswer === undefined ? null : (
                      <p className="text-ink-faint truncate text-[11px]">
                        {copy.expectedAnswer.replace(
                          "{value}",
                          JSON.stringify(field.correctAnswer),
                        )}
                      </p>
                    )}
                  </div>
                  <span className="text-ink-faint text-[12px] tabular-nums">
                    {field.achievedPoints}/{field.maxPoints}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
