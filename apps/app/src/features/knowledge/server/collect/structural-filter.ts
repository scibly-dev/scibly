import type { KnowledgeDiscardReason } from "@scibly/db/enums";
import type {
  PullRequestDetail,
  PullRequestSummary,
} from "@/features/integrations/server";

export const FILTER = {
  minComments: 2,
  choreDiscussionFloor: 5,
  minScore: 30,

  points: {
    longBody: { chars: 400, points: 12 },
    shortBody: { chars: 120, points: 6 },
    deepThread: { minComments: 2, points: 10, cap: 4 },
    substantiveComment: { chars: 300, points: 5, cap: 5 },
    answeredQuestion: { points: 8, cap: 2 },
    designLabel: { points: 15 },
    linkedIssue: { points: 3, cap: 3 },
  },

  designLabelPattern:
    /\b(design|architecture|rfc|proposal|discussion|decision|adr)\b/i,

  chorePatterns: [
    /^(chore|build|ci|style|deps|deps-dev|docs)(\([^)]*\))?!?:/i,
    /^(bump|update) \S+ from \S+ to \S+/i,
    /\btypos?\b/i,
    /^release[: ]/i,
    /^v?\d+\.\d+\.\d+\s*$/,
  ],
} as const;

export function rejectFromSummary(
  pullRequest: PullRequestSummary,
): KnowledgeDiscardReason | null {
  if (
    pullRequest.authorType === "Bot" ||
    /\[bot\]$/i.test(pullRequest.authorLogin ?? "")
  ) {
    return "BOT_AUTHOR";
  }
  if (pullRequest.commentCount < FILTER.minComments) return "NO_DISCUSSION";
  if (
    FILTER.chorePatterns.some((pattern) =>
      pattern.test(pullRequest.title.trim()),
    ) &&
    pullRequest.commentCount < FILTER.choreDiscussionFloor
  ) {
    return "CHORE_TITLE";
  }
  return null;
}

const capped = (
  count: number,
  { points, cap }: { points: number; cap: number },
) => Math.min(count, cap) * points;

/** A question asked in one comment and replied to in the same thread. */
const answeredQuestions = (detail: PullRequestDetail) =>
  detail.threads.filter((thread) =>
    thread.comments.some(
      (comment, index) =>
        comment.body.includes("?") && index < thread.comments.length - 1,
    ),
  ).length;

/** Kept on the row even for discards, so the threshold can be tuned against real numbers. */
export function scoreDiscussionDensity(detail: PullRequestDetail): number {
  const { points } = FILTER;
  const allComments = [
    ...detail.comments,
    ...detail.threads.flatMap((thread) => thread.comments),
  ];

  const bodyPoints =
    detail.body.length >= points.longBody.chars
      ? points.longBody.points
      : detail.body.length >= points.shortBody.chars
        ? points.shortBody.points
        : 0;

  return (
    bodyPoints +
    capped(
      detail.threads.filter(
        (thread) => thread.comments.length >= points.deepThread.minComments,
      ).length,
      points.deepThread,
    ) +
    capped(
      allComments.filter(
        (comment) => comment.body.length >= points.substantiveComment.chars,
      ).length,
      points.substantiveComment,
    ) +
    capped(answeredQuestions(detail), points.answeredQuestion) +
    (detail.labels.some((label) => FILTER.designLabelPattern.test(label))
      ? points.designLabel.points
      : 0) +
    capped(detail.linkedIssues.length, points.linkedIssue)
  );
}

export const isDenseEnough = (score: number) => score >= FILTER.minScore;
