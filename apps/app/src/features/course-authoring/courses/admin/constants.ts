export const COURSE_ADMIN_TABS = {
  CONTENT: "content",
  PEOPLE: "people",
  ANALYTICS: "analytics",
} as const;

export type CourseAdminTabType =
  (typeof COURSE_ADMIN_TABS)[keyof typeof COURSE_ADMIN_TABS];
