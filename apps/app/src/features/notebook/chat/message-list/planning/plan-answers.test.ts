import type { NotebookMessage } from "@/features/notebook/chat/contracts";
import type { PlanStep } from "@/features/notebook/chat/tools/ux-tools";
import type { PlanInvocation } from "./planning.types";

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { proposePlanOutputSchema } from "@/features/notebook/chat/tools/ux-tools";

import chatEn from "../../i18n/chat.i18n.en.json";
import {
  getInvalidPlanInvocationForPart,
  getPlanInvocations,
} from "./plan-tool-helpers";
import {
  formatPlanUserSubmission,
  getPlanSubmissionSteps,
  MAX_PLAN_STEPS,
  normalizePlanSteps,
  toPlanOutput,
  toPlanReviewOutput,
} from "./planning-utils";
import { usePlanningSteps } from "./use-planning-steps";

// Nothing is doubled here: covers the plan editor's state plus the pure
// translations either side of it (stored tool part in, output/record out).

const planning = chatEn.notebook.chat.planning;

const PROPOSED: PlanStep[] = [
  { id: "step-1", title: "Draft the first lesson" },
  { id: "step-2", title: "Add a quiz", detail: "Five questions" },
];

type Part = NotebookMessage["parts"][number];

function assistantTurn(parts: Part[]): NotebookMessage {
  return { id: "m1", role: "assistant", parts };
}

function editor(initialSteps: PlanStep[] = PROPOSED) {
  return renderHook(() => usePlanningSteps({ initialSteps }));
}

function invocation(overrides: Partial<PlanInvocation> = {}): PlanInvocation {
  return {
    toolCallId: "call-1",
    title: "Course outline",
    steps: PROPOSED,
    isAnswered: true,
    ...overrides,
  };
}

describe("confirming sends the plan as it was shown", () => {
  it("an untouched plan is a confirmation, not an adjustment", () => {
    const { result } = editor();

    const output = toPlanReviewOutput({
      isDirty: result.current.isDirty,
      steps: result.current.submitSteps,
    });

    expect(output?.decision).toBe("confirmed");
    expect(output?.steps).toEqual(PROPOSED);
  });

  it("what is confirmed is what the editor holds, not what arrived", () => {
    const { result } = editor();

    act(() => result.current.updateStep("step-2", { detail: "Ten questions" }));

    const output = toPlanReviewOutput({
      isDirty: result.current.isDirty,
      steps: result.current.submitSteps,
    });

    expect(output?.steps?.at(-1)?.detail).toBe("Ten questions");
  });
});

describe("denying carries no agreed steps", () => {
  it("a denial sends the decision and the author's words, never steps", () => {
    const output = toPlanOutput("denied", {
      feedback: "  Start with the assessment instead.  ",
      steps: PROPOSED,
    });

    expect(output.decision).toBe("denied");
    expect(output.feedback).toBe("Start with the assessment instead.");
    expect(output.steps).toBeUndefined();
  });

  it("a denial with nothing typed carries no empty feedback", () => {
    expect(
      toPlanOutput("denied", { feedback: "   " }).feedback,
    ).toBeUndefined();
  });

  it("the model is not shown steps it may proceed with", () => {
    const denied = invocation({
      answer: { decision: "denied", feedback: "No" },
    });

    expect(formatPlanUserSubmission(denied, planning)).not.toContain(
      "Draft the first lesson\n",
    );
  });
});

describe("adjusting sends the complete final list", () => {
  it("an edited plan reports every step that survived, in order", () => {
    const { result } = editor();

    act(() =>
      result.current.updateStep("step-2", { title: "Add two quizzes" }),
    );
    act(() => result.current.addStep("Write a summary", " Recap the lesson "));

    const output = toPlanReviewOutput({
      isDirty: result.current.isDirty,
      steps: result.current.submitSteps,
      feedback: "Split the quiz in two",
    });

    expect(output?.decision).toBe("adjusted");
    expect(output?.steps?.map((step) => step.title)).toEqual([
      "Draft the first lesson",
      "Add two quizzes",
      "Write a summary",
    ]);
    expect(output?.steps?.at(-1)?.detail).toBe("Recap the lesson");
    expect(output?.feedback).toBe("Split the quiz in two");
  });

  it("a removed step is absent, not marked as removed", () => {
    const { result } = editor();

    act(() => result.current.removeStep("step-1"));

    expect(result.current.submitSteps.map((step) => step.id)).toEqual([
      "step-2",
    ]);
  });
});

describe("the editor's bounds are the schema's bounds", () => {
  it("a plan with every step deleted cannot be submitted", () => {
    const { result } = editor();

    act(() => result.current.removeStep("step-1"));
    act(() => result.current.removeStep("step-2"));

    expect(
      toPlanReviewOutput({ isDirty: true, steps: result.current.submitSteps }),
    ).toBeNull();
  });

  it("the 21st step is refused by the editor, not by the schema afterwards", () => {
    const full = Array.from({ length: MAX_PLAN_STEPS }, (_, index) => ({
      id: `step-${index}`,
      title: `Step ${index}`,
    }));
    const { result } = editor(full);

    act(() => result.current.addStep("One step too many"));

    expect(result.current.steps).toHaveLength(MAX_PLAN_STEPS);
    expect(
      proposePlanOutputSchema.safeParse(
        toPlanReviewOutput({
          isDirty: true,
          steps: result.current.submitSteps,
        }),
      ).success,
    ).toBe(true);
  });
});

describe("step ids survive editing", () => {
  it("retitling a step keeps the id the agent proposed", () => {
    const { result } = editor();

    act(() => result.current.updateStep("step-1", { title: "Draft lesson 1" }));

    expect(result.current.submitSteps[0]).toEqual({
      id: "step-1",
      title: "Draft lesson 1",
      detail: undefined,
    });
  });

  it("a step deleted and retyped identically is an adjustment, not a confirmation", () => {
    const { result } = editor();

    act(() => result.current.removeStep("step-2"));
    act(() => result.current.addStep("Add a quiz", "Five questions"));

    expect(result.current.submitSteps.map((step) => step.title)).toEqual(
      PROPOSED.map((step) => step.title),
    );
    expect(result.current.submitSteps[1]?.id).not.toBe("step-2");
    expect(result.current.isDirty).toBe(true);
  });

  it("an added step gets an id that collides with nothing in the plan", () => {
    const { result } = editor();

    act(() => result.current.addStep("Write a summary"));
    act(() => result.current.addStep("Publish"));

    const ids = result.current.submitSteps.map((step) => step.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("blank steps are dropped, never sent", () => {
  it("a step whose title the author emptied does not reach the model", () => {
    const { result } = editor();

    act(() => result.current.updateStep("step-1", { title: "   " }));

    expect(result.current.submitSteps.map((step) => step.id)).toEqual([
      "step-2",
    ]);
  });

  it("a blank title is not addable in the first place", () => {
    const { result } = editor();

    act(() => result.current.addStep("   ", "with a detail"));

    expect(result.current.steps).toHaveLength(PROPOSED.length);
  });

  it("whitespace-only detail is sent as no detail", () => {
    expect(
      normalizePlanSteps([{ id: "step-1", title: " Draft ", detail: "  " }]),
    ).toEqual([{ id: "step-1", title: "Draft", detail: undefined }]);
  });
});

describe("the author reads back what was sent", () => {
  it("a confirmed plan shows the steps from the output", () => {
    const answered = invocation({
      answer: {
        decision: "confirmed",
        steps: [{ id: "step-1", title: "Draft the first lesson" }],
      },
    });

    expect(getPlanSubmissionSteps(answered)).toEqual([
      {
        id: "step-1",
        index: 1,
        title: "Draft the first lesson",
        detail: undefined,
      },
    ]);
  });

  it("an output with no steps shows none, rather than the agent's proposal", () => {
    const answered = invocation({ answer: { decision: "confirmed" } });

    expect(getPlanSubmissionSteps(answered)).toEqual([]);
  });

  it("a denial shows the proposal it rejected", () => {
    const denied = invocation({ answer: { decision: "denied" } });

    expect(getPlanSubmissionSteps(denied).map((step) => step.id)).toEqual([
      "step-1",
      "step-2",
    ]);
  });

  it("a call with no readable output says so instead of inventing a decision", () => {
    expect(formatPlanUserSubmission(invocation(), planning)).toBe(
      planning.noResponseLabel,
    );
  });
});

describe("a call with an output is answered, whatever it says", () => {
  it("a thin output still closes the card, and is reported as it stands", () => {
    const [plan] = getPlanInvocations(
      assistantTurn([
        {
          type: "tool-proposePlan",
          toolCallId: "call-1",
          state: "output-available",
          input: { title: "Course outline", steps: PROPOSED },
          output: { decision: "confirmed", steps: [] },
        },
      ]),
    );

    expect(plan?.isAnswered).toBe(true);
    expect(plan?.answer?.decision).toBe("confirmed");

    expect(plan && getPlanSubmissionSteps(plan)).toEqual([]);
  });

  it("an unanswered call is open", () => {
    const [plan] = getPlanInvocations(
      assistantTurn([
        {
          type: "tool-proposePlan",
          toolCallId: "call-1",
          state: "input-available",
          input: { title: "Course outline", steps: PROPOSED },
        },
      ]),
    );

    expect(plan?.isAnswered).toBe(false);
  });
});

describe("a plan the schema rejects is not drawn as a plan", () => {
  it("a plan with no steps is an error card, not an empty plan", () => {
    const message = assistantTurn([
      {
        type: "tool-proposePlan",
        toolCallId: "call-1",
        state: "input-available",
        input: { title: "Course outline", steps: [] },
      },
    ]);

    expect(getPlanInvocations(message)).toEqual([]);
    expect(getInvalidPlanInvocationForPart(message, "call-1")).toEqual({
      toolCallId: "call-1",
      isAnswered: false,
    });
  });

  it("a plan whose steps are all blank is not a plan either", () => {
    const message = assistantTurn([
      {
        type: "tool-proposePlan",
        toolCallId: "call-1",
        state: "input-available",
        input: { title: "Course outline", steps: [{ title: "   " }] },
      },
    ]);

    expect(getInvalidPlanInvocationForPart(message, "call-1")).toEqual({
      toolCallId: "call-1",
      isAnswered: false,
    });
  });

  it("the error card knows whether the call still needs an output", () => {
    const message = assistantTurn([
      {
        type: "tool-proposePlan",
        toolCallId: "call-1",
        state: "output-available",
        input: { title: "Course outline", steps: [] },
        output: { error: "invalid_tool_input" },
      },
    ]);

    expect(getInvalidPlanInvocationForPart(message, "call-1")?.isAnswered).toBe(
      true,
    );
  });

  it("a plan that parses is left alone", () => {
    const message = assistantTurn([
      {
        type: "tool-proposePlan",
        toolCallId: "call-1",
        state: "input-available",
        input: { title: "Course outline", steps: PROPOSED },
      },
    ]);

    expect(getInvalidPlanInvocationForPart(message, "call-1")).toBeNull();
  });
});
