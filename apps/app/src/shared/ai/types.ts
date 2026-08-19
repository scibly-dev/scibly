import type { CourseMutationEvent } from "@scibly/showcase";

export type CourseDelta =
  | CourseMutationEvent
  | { type: "invalidation-updated"; courseId: string; lessonIds?: string[] };
