export const FUNNEL = {
  triage: {
    batchSize: 15,
    /** Documentation-worthiness, 0-100. */
    minWorth: 60,
    digestChars: 1_200,
    commentBudget: 2_000,
    commentChars: 250,
    /** Under this a comment is an acknowledgement, not an argument. */
    minCommentChars: 80,
    maxOutputTokens: 1_500,
  },
  extract: {
    /** Confidence, 0-100. */
    minConfidence: 60,
    maxInsights: 8,
    maxOutputTokens: 4_000,
  },
  retries: 2,
  retryAfterMinutes: 60,
  retryBatch: 200,
  strandedScan: 5_000,
  maxAttempts: 5,
} as const;
