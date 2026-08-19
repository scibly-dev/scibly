import type { PendingSceneSubmission } from "../progression/lesson-progression.model";

import { buildSceneFeedbackSummary } from "./scene-feedback-summary";

// Persisted scene analytics store graded blocks but not feedback summaries —
// hydrate once here, not on every view-model derivation.
function hydratePendingSubmissionFeedback(
  submission: PendingSceneSubmission,
): PendingSceneSubmission {
  if (submission.feedbackSummary || !submission.gradedBlocks?.length) {
    return submission;
  }
  const feedbackSummary = buildSceneFeedbackSummary(submission.gradedBlocks);
  if (!feedbackSummary) return submission;
  return { ...submission, feedbackSummary };
}

export function hydratePendingSubmissions(
  submissions: Record<string, PendingSceneSubmission>,
) {
  const hydrated: Record<string, PendingSceneSubmission> = {};
  for (const [sceneId, submission] of Object.entries(submissions)) {
    hydrated[sceneId] = hydratePendingSubmissionFeedback(submission);
  }
  return hydrated;
}
