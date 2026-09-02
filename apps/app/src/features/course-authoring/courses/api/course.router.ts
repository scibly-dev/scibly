import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@scibly/api/trpc";

import {
  createCourse,
  createDraftLesson,
  deleteCourse,
  deleteDraftLessons,
  enrollCourseMembers,
  getCourse,
  getCourseBlockAnalytics,
  getCourseDashboardAnalytics,
  getCourseLesson,
  getCoursePreview,
  getCourseStats,
  getOutdatedScenes,
  getPreviewSceneContent,
  getStaleSourcesForNotebook,
  linkNotebook,
  listAvailableMembers,
  listCourseEnrollments,
  listCourseLessons,
  listCourses,
  listCourseScenes,
  publishCourse,
  removeCourseEnrollment,
  reorderDraftLessons,
  resolveLessonDeletion,
  updateCourse,
  updateDraftLesson,
} from "@/features/course-authoring/server";
import {
  getPublicCourse,
  getPublicSceneContent,
} from "@/features/learning/server";

import {
  createCourseSchema,
  createLessonSchema,
  deleteCourseSchema,
  deleteLessonSchema,
  enrollMembersSchema,
  getAvailableMembersSchema,
  getBlockAnalyticsSchema,
  getCourseByIdSchema,
  getCourseStatsSchema,
  getDashboardAnalyticsSchema,
  getLessonSchema,
  getOutdatedScenesSchema,
  getPreviewSceneContentSchema,
  getPreviewSchema,
  getPublicCourseSchema,
  getPublicSceneContentSchema,
  getStaleSourcesForNotebookSchema,
  linkNotebookSchema,
  listAllScenesForCourseSchema,
  listCoursesSchema,
  listEnrollmentsSchema,
  listLessonsSchema,
  publishCourseSchema,
  removeEnrollmentSchema,
  resolveLessonDeletionSchema,
  updateCourseSchema,
  updateLessonOrderSchema,
  updateLessonSchema,
} from "./course.schema";

const userId = (ctx: { session: { user: { id: string } } }) =>
  ctx.session.user.id;

export const courseRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(getCourseByIdSchema)
    .query(({ input, ctx }) => getCourse(userId(ctx), input.courseId)),

  getPreview: protectedProcedure
    .input(getPreviewSchema)
    .query(({ input, ctx }) => getCoursePreview(userId(ctx), input.courseId)),

  getPreviewSceneContent: protectedProcedure
    .input(getPreviewSceneContentSchema)
    .query(({ input, ctx }) =>
      getPreviewSceneContent(userId(ctx), input.courseId, input.sceneId),
    ),

  listEnrollments: protectedProcedure
    .input(listEnrollmentsSchema)
    .query(({ input, ctx }) => listCourseEnrollments(userId(ctx), input)),

  getStats: protectedProcedure
    .input(getCourseStatsSchema)
    .query(({ input, ctx }) => getCourseStats(userId(ctx), input.courseId)),

  getDashboardAnalytics: protectedProcedure
    .input(getDashboardAnalyticsSchema)
    .query(({ input, ctx }) => getCourseDashboardAnalytics(userId(ctx), input)),

  getBlockAnalytics: protectedProcedure
    .input(getBlockAnalyticsSchema)
    .query(({ input, ctx }) => getCourseBlockAnalytics(userId(ctx), input)),

  list: protectedProcedure
    .input(listCoursesSchema)
    .query(({ input, ctx }) => listCourses(userId(ctx), input)),

  update: protectedProcedure
    .input(updateCourseSchema)
    .mutation(({ input, ctx }) => updateCourse(userId(ctx), input)),

  create: protectedProcedure
    .input(createCourseSchema)
    .mutation(({ input, ctx }) => createCourse(userId(ctx), input)),

  linkNotebook: protectedProcedure
    .input(linkNotebookSchema)
    .mutation(({ input, ctx }) => linkNotebook(userId(ctx), input)),

  getOutdatedScenes: protectedProcedure
    .input(getOutdatedScenesSchema)
    .query(({ input, ctx }) => getOutdatedScenes(userId(ctx), input.courseId)),

  getStaleSourcesForNotebook: protectedProcedure
    .input(getStaleSourcesForNotebookSchema)
    .query(({ input, ctx }) =>
      getStaleSourcesForNotebook(userId(ctx), input.notebookId),
    ),

  getAvailableMembers: protectedProcedure
    .input(getAvailableMembersSchema)
    .query(({ input, ctx }) => listAvailableMembers(userId(ctx), input)),

  enrollMembers: protectedProcedure
    .input(enrollMembersSchema)
    .mutation(({ input, ctx }) => enrollCourseMembers(userId(ctx), input)),

  removeEnrollment: protectedProcedure
    .input(removeEnrollmentSchema)
    .mutation(({ input, ctx }) => removeCourseEnrollment(userId(ctx), input)),

  createLesson: protectedProcedure
    .input(createLessonSchema)
    .mutation(({ input, ctx }) => createDraftLesson(userId(ctx), input)),

  updateLesson: protectedProcedure
    .input(updateLessonSchema)
    .mutation(({ input, ctx }) => updateDraftLesson(userId(ctx), input)),

  getLesson: protectedProcedure
    .input(getLessonSchema)
    .query(({ input, ctx }) => getCourseLesson(userId(ctx), input)),

  listLessons: protectedProcedure
    .input(listLessonsSchema)
    .query(({ input, ctx }) => listCourseLessons(userId(ctx), input)),

  listAllScenesForCourse: protectedProcedure
    .input(listAllScenesForCourseSchema)
    .query(({ input, ctx }) => listCourseScenes(userId(ctx), input.courseId)),

  updateLessonOrder: protectedProcedure
    .input(updateLessonOrderSchema)
    .mutation(({ input, ctx }) => reorderDraftLessons(userId(ctx), input)),

  deleteLesson: protectedProcedure
    .input(deleteLessonSchema)
    .mutation(({ input, ctx }) => deleteDraftLessons(userId(ctx), input)),

  resolveLessonDeletion: protectedProcedure
    .input(resolveLessonDeletionSchema)
    .query(({ input, ctx }) =>
      resolveLessonDeletion(userId(ctx), input.lessonIds),
    ),

  delete: protectedProcedure
    .input(deleteCourseSchema)
    .mutation(({ input, ctx }) => deleteCourse(userId(ctx), input.courseId)),

  publishCourse: protectedProcedure
    .input(publishCourseSchema)
    .mutation(({ input, ctx }) => publishCourse(userId(ctx), input)),

  getPublicCourse: publicProcedure
    .input(getPublicCourseSchema)
    .query(({ input }) => getPublicCourse(input.courseId)),

  getPublicSceneContent: publicProcedure
    .input(getPublicSceneContentSchema)
    .query(({ input }) =>
      getPublicSceneContent(
        input.courseId,
        input.courseVersionId,
        input.sceneId,
      ),
    ),
});
