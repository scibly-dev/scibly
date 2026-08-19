import type analyticsTranslations from "./analytics/i18n/analytics.i18n.en.json";
import type courseAdminTranslations from "./courses/admin/i18n/course-admin.i18n.en.json";
import type courseListTranslations from "./courses/list/i18n/course-list.i18n.en.json";
import type enrollmentTranslations from "./enrollments/i18n/enrollments.i18n.en.json";
import type lessonAdminTranslations from "./lessons/admin/i18n/lesson-admin.i18n.en.json";
import type publishingTranslations from "./publishing/i18n/publishing.i18n.en.json";
import type sceneReviewTranslations from "./scenes/review/i18n/scene-review.i18n.en.json";

// The i18n merge discovers translations via colocated JSON files, not via this type — this only checks their shapes against the English source.
export type CoursesTranslations = typeof courseListTranslations.courses &
  typeof courseAdminTranslations.courses &
  typeof lessonAdminTranslations.courses &
  typeof sceneReviewTranslations.courses &
  typeof publishingTranslations.courses &
  typeof enrollmentTranslations.courses &
  typeof analyticsTranslations.courses;
