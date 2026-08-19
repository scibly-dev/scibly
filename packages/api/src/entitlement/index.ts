import "server-only";

export { assertAllowed, type Decision, type Refusal } from "./decision";

// The lapse rule lives with the resolution every policy already runs, so it can't be enforced one way and reported another.
export { chargeAiGeneration, type GenerationCharge } from "./consumable";
export { type CreditBalances, spendableCredits } from "./credits";
export { decideIngestFunding } from "./policies/ingest-funding";
export {
  describePaymentState,
  graceEndsAt,
  hasLapsed,
  notLapsedSubscription,
  type ResolvedPlan,
  resolveSubscribedPlan,
} from "./policy";

// The claim lives here and the mail lives in the app, so this package doesn't need a dependency on @scibly/email.
export {
  type AllowanceWarning,
  type AllowanceWarningThreshold,
  claimAllowanceWarning,
  readAllowanceWarning,
} from "./allowance-warning";

// The count is shared with the enrollment cap rather than reimplemented, so the billing page and the refusal cannot drift.
export {
  decideByoaiConfiguration,
  describeByoaiAccess,
} from "./policies/byoai-configuration";
export { type LearnerSeatUsage, readLearnerSeatUsage } from "./seats";

// A turn on the organization's own endpoint spends nothing, so `decideOwnEndpointGeneration` never reaches the debit that would otherwise ask.
export { decideOwnEndpointGeneration } from "./policies/byoai-inference";
export {
  decideCoursePublishing,
  describeCoursePublishingAccess,
} from "./policies/course-publishing";
export {
  decideEnrollment,
  describeEnrollmentAccess,
} from "./policies/enrollment";
export { decideNotebookSourceCap } from "./policies/notebook-source-cap";
export { decidePublicCourseCap } from "./policies/public-course-cap";

// Hands back where a permitted session leaves the count, so the owner's warning is judged on the same numbers.
export { decideAnonymousSession } from "./policies/anonymous-session";
