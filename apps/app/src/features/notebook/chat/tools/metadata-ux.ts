import type { ToolMetadataRegistry, ToolOutput } from "./metadata";

import { truncate } from "./metadata";
import { parseAskMultipleChoiceInput } from "./ux-tools";

const PLAN_DECISION_DETAIL = {
  confirmed: "User confirmed the plan",
  denied: "User rejected the plan",
  adjusted: "User adjusted the plan",
} as const;

function multipleChoiceDetail(output: ToolOutput<"askMultipleChoice">) {
  if (!output) return undefined;
  if (output.skipped) return "Skipped by user";
  if (output.answers) {
    const count = output.answers.length;
    return `${count} answer${count === 1 ? "" : "s"} received`;
  }
  if (output.selectedLabels?.length) return output.selectedLabels.join(", ");
  return output.customAnswer?.trim() || undefined;
}

export const UX_TOOL_METADATA = {
  proposePlan: {
    iconId: "compass",
    getStepPresentation: ({ input, output, isDone }) => {
      const stepCount = input.steps?.length;

      return {
        label: isDone ? "Plan reviewed by user" : "Proposed plan for review",
        context: input.title ? truncate(input.title, 72) : undefined,
        detail: isDone
          ? output?.decision && PLAN_DECISION_DETAIL[output.decision]
          : stepCount
            ? `${stepCount} step${stepCount === 1 ? "" : "s"} outlined`
            : undefined,
      };
    },
  },
  askMultipleChoice: {
    iconId: "compass",
    getStepPresentation: ({ input, output, isDone }) => {
      const questions = parseAskMultipleChoiceInput(input)?.questions ?? [];
      const isBatch = questions.length > 1;

      return {
        label: isDone
          ? isBatch
            ? "Collected learner answers"
            : "Collected learner answer"
          : isBatch
            ? "Waiting for learner answers"
            : "Waiting for learner answer",
        context: isBatch
          ? `${questions.length} questions in the batch`
          : questions[0]
            ? truncate(questions[0].question, 72)
            : undefined,
        detail: isDone ? multipleChoiceDetail(output) : undefined,
      };
    },
  },
} satisfies ToolMetadataRegistry;
