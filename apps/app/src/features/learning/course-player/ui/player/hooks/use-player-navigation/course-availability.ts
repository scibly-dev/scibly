export type CourseUnavailableReason =
  | "not-published"
  | "not-available"
  | "load-failed";

type CourseQueryError = {
  data?: { applicationCode?: string | null } | null;
} | null;

const DEAD_LINK_CODES = new Set(["api.not_found", "api.forbidden"]);

export function describeCourseLoadFailure(
  error: CourseQueryError,
): CourseUnavailableReason | null {
  if (!error) return null;
  const applicationCode = error.data?.applicationCode;
  if (applicationCode === "course.not_published") return "not-published";
  if (applicationCode && DEAD_LINK_CODES.has(applicationCode)) {
    return "not-available";
  }
  return "load-failed";
}
