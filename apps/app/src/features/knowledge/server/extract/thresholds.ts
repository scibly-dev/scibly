/**
 * Every number the funnel judges by, in one place — tune here, nowhere else.
 *
 * Its own file so `triage` and `extract` can both read it without importing
 * each other through the Inngest functions that wire them together.
 */
export const FUNNEL = {
  triage: {
    /** Bundles per model call. Inngest batches to this; the prompt sees them all. */
    batchSize: 15,
    /** Documentation-worthiness, 0-100. Below it the bundle is dropped, quietly. */
    minWorth: 60,
    /** Chars of a pull request body triage sees — it sorts, it does not read. */
    digestChars: 1_200,
    /** Chars of conversation excerpt per pull request. Where `worth` lives. */
    commentBudget: 2_000,
    /** Chars of any one comment in that excerpt. */
    commentChars: 250,
    /** Under this a comment is an acknowledgement, not an argument. */
    minCommentChars: 80,
  },
  extract: {
    /** Confidence, 0-100. A claim below it is never stored and never surfaced. */
    minConfidence: 60,
    /** Per bundle. A discussion that "produced" more than this produced noise. */
    maxInsights: 8,
    maxOutputTokens: 4_000,
  },
  /**
   * Attempts Inngest gives triage and extraction. Read by the functions
   * themselves as well: the last attempt records the failure, because a batched
   * function's `onFailure` only ever sees one event of its batch.
   */
  retries: 2,
  /** How long a bundle may sit unprocessed before the nightly sweep retries it. */
  retryAfterMinutes: 60,
  /** Bundles the sweep re-queues per organization per night. */
  retryBatch: 200,
} as const;
