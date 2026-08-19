"use client";

import type { NotebookTranslations } from "../../../i18n/notebook.types";
import type { MultipleChoiceQuestionInvocation } from "./multiple-choice.types";

import { cn } from "@scibly/ui/utils";
import { Check, ListChecks } from "lucide-react";

import { UxSubmissionBubble } from "../shared/ux-submission-bubble";
import {
  formatMultipleChoiceUserSubmission,
  getMultipleChoiceSubmissionEntries,
} from "./multiple-choice-utils";

interface MultipleChoiceSubmissionBubbleProps {
  invocation: MultipleChoiceQuestionInvocation;
  t: NotebookTranslations;
  canCopy?: boolean;
}

export function MultipleChoiceSubmissionBubble({
  invocation,
  t,
  canCopy = true,
}: MultipleChoiceSubmissionBubbleProps) {
  const mcq = t.chat.multipleChoice;
  const text = formatMultipleChoiceUserSubmission(invocation, mcq);
  const entries = getMultipleChoiceSubmissionEntries(invocation, mcq);
  const isBatch = entries.length > 1;

  return (
    <UxSubmissionBubble
      hint={mcq.submissionHint}
      label={mcq.submissionLabel}
      detail={isBatch ? mcq.submissionBatchDetail : mcq.submissionSingleDetail}
      copyText={text}
      canCopy={canCopy}
      icon={ListChecks}
    >
      <div className="divide-hairline divide-y-2 dark:divide-neutral-800">
        {entries.map((entry, index) => (
          <div key={`${entry.question}-${index}`} className="px-4 py-3.5">
            <p className="text-[12px] leading-snug font-medium text-neutral-500 dark:text-neutral-400">
              {isBatch && (
                <span className="mr-1.5 text-neutral-400 tabular-nums dark:text-neutral-500">
                  {index + 1}.
                </span>
              )}
              {entry.question}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {entry.answerLabels.map((label, labelIndex) => (
                <span
                  key={`${label}-${labelIndex}`}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] leading-none font-medium",
                    entry.skipped || entry.isEmpty
                      ? "bg-neutral-100 text-neutral-500 italic dark:bg-neutral-800/80 dark:text-neutral-400"
                      : "bg-[hsl(var(--section-accent)/0.12)] text-[hsl(var(--section-accent))] dark:bg-[hsl(var(--section-accent)/0.18)]",
                  )}
                >
                  {!entry.skipped && !entry.isEmpty && (
                    <Check
                      className="h-3 w-3 shrink-0 stroke-[2.5]"
                      aria-hidden
                    />
                  )}
                  {label}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </UxSubmissionBubble>
  );
}
