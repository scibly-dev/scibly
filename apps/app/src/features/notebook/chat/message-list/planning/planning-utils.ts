import type {
  PlanDecision,
  PlanStep,
  ProposePlanOutput,
} from "@/features/notebook/chat/tools/ux-tools";
import type { NotebookTranslations } from "../../../i18n/notebook.types";
import type { PlanInvocation } from "./planning.types";

export const MAX_PLAN_STEPS = 20;

/**
 * Ids come from parse time and from the editor, so a title is all a step has to
 * have to earn its place.
 */
export function normalizePlanSteps(steps: PlanStep[] | undefined): PlanStep[] {
  return (steps ?? [])
    .filter((step) => step.title?.trim())
    .map((step) => ({
      id: step.id,
      title: step.title.trim(),
      detail: step.detail?.trim() || undefined,
    }));
}

export function hasMeaningfulPlanResponse(
  answer: ProposePlanOutput | undefined,
): boolean {
  return answer?.decision !== undefined;
}

export function toPlanOutput(
  decision: PlanDecision,
  options?: {
    steps?: PlanStep[];
    feedback?: string;
  },
): ProposePlanOutput {
  return {
    decision,

    steps: decision === "denied" ? undefined : options?.steps,
    feedback: options?.feedback?.trim() || undefined,
  };
}

// Adjusted plans carry the full edited list, not a diff — the agent matches steps by id.
export function toPlanReviewOutput({
  isDirty,
  steps,
  feedback,
}: {
  isDirty: boolean;
  steps: PlanStep[];
  feedback?: string;
}): ProposePlanOutput | null {
  if (steps.length === 0 || steps.length > MAX_PLAN_STEPS) return null;

  return isDirty
    ? toPlanOutput("adjusted", { steps, feedback })
    : toPlanOutput("confirmed", { steps });
}

export function getPlanDecisionLabel(
  decision: PlanDecision | undefined,
  t: NotebookTranslations["chat"]["planning"],
): string {
  switch (decision) {
    case "confirmed":
      return t.decisionConfirmed;
    case "denied":
      return t.decisionDenied;
    case "adjusted":
      return t.decisionAdjusted;
    default:
      return t.noResponseLabel;
  }
}

export function formatPlanUserSubmission(
  invocation: PlanInvocation,
  t: NotebookTranslations["chat"]["planning"],
): string {
  const answer = invocation.answer;
  if (!answer) return t.noResponseLabel;

  const lines = [getPlanDecisionLabel(answer.decision, t)];

  if (answer.feedback?.trim()) {
    lines.push(`${t.feedbackLabel}: ${answer.feedback.trim()}`);
  }

  const steps =
    answer.decision === "denied" ? invocation.steps : (answer.steps ?? []);

  if (steps.length > 0 && answer.decision !== "denied") {
    lines.push("");
    steps.forEach((step, index) => {
      lines.push(`${index + 1}. ${step.title}`);
      if (step.detail?.trim()) {
        lines.push(`   ${step.detail.trim()}`);
      }
    });
  }

  return lines.join("\n");
}

interface PlanSubmissionStepEntry {
  id: string;
  index: number;
  title: string;
  detail?: string;
}

export function getPlanSubmissionSteps(
  invocation: PlanInvocation,
): PlanSubmissionStepEntry[] {
  const isDenied = invocation.answer?.decision === "denied";
  const steps = isDenied ? invocation.steps : (invocation.answer?.steps ?? []);

  return steps.map((step, index) => ({
    id: step.id,
    index: index + 1,
    title: step.title,
    detail: step.detail,
  }));
}

export function planStepsAreEqual(a: PlanStep[], b: PlanStep[]): boolean {
  if (a.length !== b.length) return false;

  return a.every((step, index) => {
    const other = b[index];
    if (!other) return false;
    return (
      step.id === other.id &&
      step.title === other.title &&
      (step.detail ?? "") === (other.detail ?? "")
    );
  });
}
