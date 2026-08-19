"use client";

import type { NotebookTranslations } from "../../../i18n/notebook.types";
import type { PlanInvocation } from "./planning.types";

import { cn } from "@scibly/ui/utils";
import { Check, ClipboardList, X } from "lucide-react";

import { UxSubmissionBubble } from "../shared/ux-submission-bubble";
import {
  formatPlanUserSubmission,
  getPlanDecisionLabel,
  getPlanSubmissionSteps,
} from "./planning-utils";

interface PlanningSubmissionBubbleProps {
  invocation: PlanInvocation;
  t: NotebookTranslations;
  canCopy?: boolean;
}

export function PlanningSubmissionBubble({
  invocation,
  t,
  canCopy = true,
}: PlanningSubmissionBubbleProps) {
  const planning = t.chat.planning;
  const answer = invocation.answer;
  const text = formatPlanUserSubmission(invocation, planning);
  const steps = getPlanSubmissionSteps(invocation);
  const decision = answer?.decision;

  return (
    <UxSubmissionBubble
      hint={planning.submissionHint}
      label={planning.submissionLabel}
      detail={decision ? getPlanDecisionLabel(decision, planning) : undefined}
      copyText={text}
      canCopy={canCopy}
      icon={ClipboardList}
    >
      {answer?.feedback?.trim() && (
        <div className="border-hairline border-b-2 px-4 py-3.5 dark:border-neutral-800">
          <p className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
            {planning.feedbackLabel}
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-neutral-800 dark:text-neutral-200">
            {answer.feedback.trim()}
          </p>
        </div>
      )}

      {steps.length > 0 && (
        <div className="px-4 py-3.5">
          <div className="flex flex-wrap gap-1.5">
            {steps.map((step) => (
              <span
                key={step.id}
                className={cn(
                  "inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] leading-none font-medium",
                  decision === "denied"
                    ? "bg-neutral-100 text-neutral-500 dark:bg-neutral-800/80 dark:text-neutral-400"
                    : "bg-[hsl(var(--section-accent)/0.12)] text-[hsl(var(--section-accent))] dark:bg-[hsl(var(--section-accent)/0.18)]",
                )}
              >
                {decision === "denied" ? (
                  <X className="h-3 w-3 shrink-0" aria-hidden />
                ) : (
                  <Check
                    className="h-3 w-3 shrink-0 stroke-[2.5]"
                    aria-hidden
                  />
                )}
                <span className="truncate">
                  {step.index}. {step.title}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </UxSubmissionBubble>
  );
}
