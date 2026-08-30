import "server-only";

export {
  authorizeCourseMetadataRoom,
  authorizeSceneEditorRoom,
  requireCourseAdmin,
  requireCourseEnrollment,
} from "./access/server/policy";
export {
  getCourseBlockAnalytics,
  getCourseDashboardAnalytics,
  getCourseStats,
} from "./analytics/server/analytics";
export {
  getCoursePreview,
  getPreviewSceneContent,
} from "./courses/server/course-preview";
export {
  createCourse,
  deleteCourse,
  getCourse,
  linkNotebook,
  listCourses,
  updateCourse,
} from "./courses/server/courses";
export {
  enrollCourseMembers,
  listAvailableMembers,
  listCourseEnrollments,
  removeCourseEnrollment,
} from "./enrollments/server/enrollments";
export {
  createDraftLesson,
  deleteDraftLessons,
  getCourseLesson,
  listCourseLessons,
  listCourseScenes,
  reorderDraftLessons,
  updateDraftLesson,
} from "./lessons/server/lessons";
export { publishCourse } from "./publishing/server/publish-course";
export { publishCourseSnapshot } from "./publishing/server/publish-course-snapshot";
export { writeSceneHtml } from "./scenes/editor/document-synchronization/server/scene-document";
export {
  getOutdatedScenes,
  getStaleSourcesForNotebook,
} from "./scenes/review/server/source-status";
export { requireDraftSceneContentAccess } from "./scenes/server/scene-access";
export {
  setDraftSceneLineage,
  updateDraftScene,
  writeSceneContent,
} from "./scenes/server/scene-content";
export { mapAuthoringScene } from "./scenes/server/scene-mapping";
export {
  cloneDraftScene,
  createDraftScene,
  deleteDraftScenes,
} from "./scenes/server/scene-mutations";
export { reorderDraftScenes } from "./scenes/server/scene-ordering";
export {
  getDeletionNavigationContext,
  getSceneContent,
  getSceneLineage,
  getSceneLocation,
  listLessonScenes,
} from "./scenes/server/scene-queries";
export { buildCourseAuthoringNotebookTools } from "./tools/tools";
