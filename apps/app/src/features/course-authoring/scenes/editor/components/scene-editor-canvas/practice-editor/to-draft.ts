import type { RouterOutputs } from "@/shared/api/trpc/client";

export type PracticeData = RouterOutputs["scene"]["getPractice"];

export type Draft = { html: string; solutionText: string; explanation: string };

export function toDraft(
  data: Pick<PracticeData, "html" | "solution" | "explanation">,
): Draft {
  return {
    html: data.html,
    solutionText: data.solution ? JSON.stringify(data.solution, null, 2) : "",
    explanation: data.explanation ?? "",
  };
}
