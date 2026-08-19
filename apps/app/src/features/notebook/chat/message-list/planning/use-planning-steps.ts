import type { PlanStep } from "@/features/notebook/chat/tools/ux-tools";

import { useCallback, useMemo, useState } from "react";

import {
  MAX_PLAN_STEPS,
  normalizePlanSteps,
  planStepsAreEqual,
} from "./planning-utils";

export { MAX_PLAN_STEPS };

function cloneSteps(steps: PlanStep[]): PlanStep[] {
  return steps.map((step) => ({ ...step }));
}

function createStepId() {
  return `step-${crypto.randomUUID()}`;
}

interface UsePlanningStepsOptions {
  initialSteps: PlanStep[];
}

export function usePlanningSteps({ initialSteps }: UsePlanningStepsOptions) {
  const baselineSteps = useMemo(
    () => normalizePlanSteps(initialSteps),
    [initialSteps],
  );
  const [steps, setSteps] = useState<PlanStep[]>(() =>
    cloneSteps(normalizePlanSteps(initialSteps)),
  );
  const [newStepTitle, setNewStepTitle] = useState("");
  const [newStepDetail, setNewStepDetail] = useState("");

  const submitSteps = useMemo(() => normalizePlanSteps(steps), [steps]);

  const isDirty = useMemo(
    () => !planStepsAreEqual(submitSteps, baselineSteps),
    [baselineSteps, submitSteps],
  );

  const updateStep = useCallback(
    (stepId: string, patch: Partial<Pick<PlanStep, "title" | "detail">>) => {
      setSteps((current) =>
        current.map((step) =>
          step.id === stepId ? { ...step, ...patch } : step,
        ),
      );
    },
    [],
  );

  const removeStep = useCallback((stepId: string) => {
    setSteps((current) => current.filter((step) => step.id !== stepId));
  }, []);

  const addStep = useCallback((title: string, detail?: string) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    setSteps((current) => {
      if (current.length >= MAX_PLAN_STEPS) return current;
      return [
        ...current,
        {
          id: createStepId(),
          title: trimmedTitle,
          detail: detail?.trim() || undefined,
        },
      ];
    });

    setNewStepTitle("");
    setNewStepDetail("");
  }, []);

  return {
    steps,
    submitSteps,
    isDirty,
    newStepTitle,
    setNewStepTitle,
    newStepDetail,
    setNewStepDetail,
    updateStep,
    removeStep,
    addStep,
  };
}
