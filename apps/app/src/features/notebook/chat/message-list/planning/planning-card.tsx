"use client";

import type { NotebookTranslations } from "../../../i18n/notebook.types";
import type { PlanInvocation } from "./planning.types";

import { useState } from "react";

import { useUxToolSubmit } from "../shared/use-ux-tool-submit";
import { UxCardShell } from "../shared/ux-card-shell";
import {
  PlanningAddStepRow,
  PlanningFeedbackField,
  PlanningHeader,
  PlanningStepRow,
} from "./planning-card-parts";
import { PlanningFooter } from "./planning-footer";
import { toPlanOutput, toPlanReviewOutput } from "./planning-utils";
import { MAX_PLAN_STEPS, usePlanningSteps } from "./use-planning-steps";

interface PlanningCardProps {
  invocation: PlanInvocation;
  t: NotebookTranslations;
}

type PlanningView = "review" | "deny";

const PlanningReview = ({
  invocation,
  planning,
  state,
  interactive,
  feedback,
  setFeedback,
  onDeny,
  onConfirm,
}: {
  invocation: PlanInvocation;
  planning: NotebookTranslations["chat"]["planning"];
  state: ReturnType<typeof usePlanningSteps>;
  interactive: boolean;
  feedback: string;
  setFeedback: (value: string) => void;
  onDeny: () => void;
  onConfirm: () => void;
}) => {
  return (
    <UxCardShell>
      <PlanningHeader title={invocation.title} summary={invocation.summary} />
      <div className="flex flex-col gap-1 px-4 pb-3">
        {state.steps.map((step, index) => (
          <PlanningStepRow
            key={step.id}
            index={index + 1}
            title={step.title}
            detail={step.detail ?? ""}
            titleLabel={planning.stepTitleLabel.replace(
              "{{index}}",
              String(index + 1),
            )}
            detailPlaceholder={planning.stepDetailPlaceholder}
            removeLabel={planning.removeStep}
            disabled={!interactive}
            onTitleChange={(value) =>
              state.updateStep(step.id, { title: value })
            }
            onDetailChange={(value) =>
              state.updateStep(step.id, { detail: value })
            }
            onRemove={() => state.removeStep(step.id)}
          />
        ))}
        <PlanningAddStepRow
          title={state.newStepTitle}
          detail={state.newStepDetail}
          titlePlaceholder={planning.addStep}
          detailPlaceholder={planning.stepDetailPlaceholder}
          addStepAriaLabel={planning.addStep}
          disabled={!interactive}
          atLimit={state.steps.length >= MAX_PLAN_STEPS}
          limitLabel={planning.stepLimitReached}
          onTitleChange={state.setNewStepTitle}
          onDetailChange={state.setNewStepDetail}
          onAdd={() => state.addStep(state.newStepTitle, state.newStepDetail)}
        />
      </div>
      {state.isDirty ? (
        <PlanningFeedbackField
          label={planning.adjustFeedbackLabel}
          placeholder={planning.adjustFeedbackPlaceholder}
          value={feedback}
          disabled={!interactive}
          onChange={setFeedback}
        />
      ) : null}
      <PlanningFooter
        stepCountLabel={planning.stepCount.replace(
          "{{count}}",
          String(state.steps.length),
        )}
        showStepCount={state.steps.length > 0}
        denyLabel={planning.deny}
        confirmLabel={state.isDirty ? planning.submitChanges : planning.confirm}
        disabled={!interactive}
        canConfirm={state.submitSteps.length > 0}
        onDeny={onDeny}
        onConfirm={onConfirm}
      />
    </UxCardShell>
  );
};

export function PlanningCard({ invocation, t }: PlanningCardProps) {
  const planning = t.chat.planning;
  const [view, setView] = useState<PlanningView>("review");
  const [denyFeedback, setDenyFeedback] = useState("");
  const [adjustFeedback, setAdjustFeedback] = useState("");

  const { submit, isInteractive, hasToolCallId } = useUxToolSubmit({
    tool: "proposePlan",
    toolCallId: invocation.toolCallId,
    isAnswered: invocation.isAnswered,
  });

  const state = usePlanningSteps({ initialSteps: invocation.steps });

  if (invocation.isAnswered) {
    return null;
  }

  if (!hasToolCallId) {
    return (
      <UxCardShell>
        <PlanningHeader title={invocation.title} summary={invocation.summary} />
        <p className="px-5 pb-4 text-[13px] text-neutral-500 dark:text-neutral-400">
          {planning.invalidPlan}
        </p>
      </UxCardShell>
    );
  }

  if (view === "deny") {
    return (
      <UxCardShell>
        <PlanningHeader title={invocation.title} summary={invocation.summary} />
        <PlanningFeedbackField
          label={planning.denyFeedbackLabel}
          placeholder={planning.denyFeedbackPlaceholder}
          value={denyFeedback}
          disabled={!isInteractive}
          onChange={setDenyFeedback}
        />
        <PlanningFooter
          stepCountLabel=""
          showStepCount={false}
          denyLabel={planning.back}
          confirmLabel={planning.submitDenial}
          disabled={!isInteractive}
          canConfirm
          onDeny={() => setView("review")}
          onConfirm={() =>
            submit(toPlanOutput("denied", { feedback: denyFeedback }))
          }
        />
      </UxCardShell>
    );
  }

  return (
    <PlanningReview
      invocation={invocation}
      planning={planning}
      state={state}
      interactive={isInteractive}
      feedback={adjustFeedback}
      setFeedback={setAdjustFeedback}
      onDeny={() => setView("deny")}
      onConfirm={() => {
        const output = toPlanReviewOutput({
          isDirty: state.isDirty,
          steps: state.submitSteps,
          feedback: adjustFeedback,
        });
        if (output) submit(output);
      }}
    />
  );
}
