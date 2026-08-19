export {
  buildShowcaseFixture,
  SHOWCASE_COURSE_ID,
  SHOWCASE_NOTEBOOK_ID,
  SHOWCASE_ORG_SLUG,
  showcaseFixture,
  showcaseIds,
} from "./fixture";
export { createShowcaseStore, type ShowcaseStore } from "./store";
export type {
  GroundTruthCourse,
  GroundTruthDemoMeta,
  GroundTruthDemoSource,
  GroundTruthLesson,
  GroundTruthScene,
  ShowcaseCourse,
  ShowcaseFixture,
  ShowcaseGeneratedImage,
  ShowcaseLesson,
  ShowcaseScene,
  ShowcaseSnapshot,
  ShowcaseSource,
  ShowcaseSourceType,
  ShowcaseTimelineEvent,
} from "./types";
export {
  type CourseEntity,
  courseEntityIds,
  type CourseMutationEvent,
  CYBER_SAFETY_COURSE_ID,
  CYBER_SAFETY_IMAGE_URL,
  cyberSafetyCourse,
  cyberSafetyDemoMeta,
  isCourseMutationEvent,
} from "@scibly/course-content";
