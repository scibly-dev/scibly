import { EnrollmentStatus } from "@scibly/db/enums";

export const STATUS_FILTER = {
  ALL: "all",
  NOT_STARTED: EnrollmentStatus.NOT_STARTED,
  IN_PROGRESS: EnrollmentStatus.IN_PROGRESS,
  COMPLETED: EnrollmentStatus.COMPLETED,
} as const;

export type StatusFilterType =
  (typeof STATUS_FILTER)[keyof typeof STATUS_FILTER];
