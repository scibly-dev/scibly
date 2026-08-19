export type GuideFeedbackStatus = "perfect" | "partial" | "incorrect";
export type GuideCharacterReaction =
  | "idle"
  | GuideFeedbackStatus
  | "celebrate"
  | "mourning";

export function reactionFromSceneFeedback(
  status: GuideFeedbackStatus | null | undefined,
  isCelebrating: boolean,
): GuideCharacterReaction {
  if (isCelebrating) return "celebrate";
  if (!status) return "idle";
  return status;
}
