import type { AnonymousSessionSource, CourseMode } from "@scibly/db/enums";
import type { RouterOutputs } from "@/shared/api/trpc/client";

export type RawMemberCourse = RouterOutputs["learning"]["getLearnerCourse"];
export type RawPublicCourse = RouterOutputs["course"]["getPublicCourse"];
export type RawPreviewCourse = RouterOutputs["course"]["getPreview"];
export type DbProgress = RouterOutputs["sceneProgress"]["getLearnerProgress"];

/**
 * React Query's `refetch`, awaited only to sequence what happens after it.
 * Progress arrives through the query's own `data`, never through this promise,
 * so the resolved value is deliberately not part of the contract.
 */
// eslint-disable-next-line anti-slop/no-unknown-returns -- see above
export type RefetchProgress = () => Promise<unknown>;

export interface NormalizedCourse {
  id: string;
  title: string;

  mode: CourseMode;
  passingScorePct: number | null;
  maxTries: number | null;
  maxSp: number;
  // The public manifest's lesson type: member and preview lessons are the
  // same shape minus the virtual pitch scenes, so they assign into it.
  lessons: RawPublicCourse["lessons"];
  organization: { name: string } | null;
  courseVersionId: string;
  version: number;
  thumbnail: string | null;
}

export interface UsePlayerNavigationParams {
  courseId: string;
  isAnonymous?: boolean;
  anonymousId?: string;

  source?: AnonymousSessionSource;

  embedOrigin?: string | null;
}
