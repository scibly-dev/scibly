import type { AnswerOrderIdentity } from "@/shared/content/editor/assessment/learner/answer-order";

import { type ProgressionMode } from "./player-types";

type AnswerOrderIdentityInput = {
  mode: ProgressionMode;
  enrollmentId?: string;
  anonymousId?: string;
  courseId?: string;
  triesCount?: number;
  restartCount: number;
};

// `attempt` falls back to `restartCount` since the client has no attempt id
// of its own — every input here is synchronous, so the order never shifts
// mid-read.
export function playerAnswerOrderIdentity({
  mode,
  enrollmentId,
  anonymousId,
  courseId,
  triesCount,
  restartCount,
}: AnswerOrderIdentityInput): AnswerOrderIdentity {
  const learnerId =
    enrollmentId ?? anonymousId ?? (mode === "preview" ? courseId : undefined);

  return { learnerId: learnerId ?? null, attempt: triesCount ?? restartCount };
}
