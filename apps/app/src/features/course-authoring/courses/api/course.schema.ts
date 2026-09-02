import { CourseMode, LessonIcon } from "@scibly/db/enums";
import { z } from "zod";

import {
  updateCourseUpdatesSchema,
  updateLessonUpdatesSchema,
} from "@/shared/content/course/course-validation";
import { lessonDescriptionSchema } from "@/shared/content/learning/lesson-description";

import { deletionIdsSchema } from "../../deletion/api/deletion.schema";

export const getCourseByIdSchema = z.object({ courseId: z.string() });

export const listEnrollmentsSchema = z.object({
  courseId: z.string(),
  limit: z.number().min(1).max(100).default(10),
  cursor: z.number().nullish(),
  search: z.string().optional(),
  status: z
    .enum(["all", "NOT_STARTED", "IN_PROGRESS", "COMPLETED"])
    .default("all"),
});

export const getCourseStatsSchema = z.object({ courseId: z.string() });

export const listCoursesSchema = z.object({
  orgSlug: z.string(),
  limit: z.number().min(1).max(100).default(6),
  cursor: z.number().nullish(),
  search: z.string().optional(),
});

export const getAvailableMembersSchema = z.object({
  courseId: z.string(),
  search: z.string().optional(),
  limit: z.number().min(1).max(100).nullish(),
  cursor: z.number().nullish(),
});

export const listLessonsSchema = z.object({
  courseId: z.string(),
  limit: z.number().min(1).max(100).default(10),
  cursor: z.number().nullish(),
});

export const listAllScenesForCourseSchema = z.object({
  courseId: z.string(),
});

export const createCourseSchema = z.object({
  orgSlug: z
    .string()
    .describe(
      "The URL slug of the organization to create the course in (e.g. 'my-org').",
    ),
  title: z.string().min(1).describe("The title of the course."),
  description: z
    .string()
    .optional()
    .describe(
      "A short description summarizing the course content and learning goals.",
    ),
  category: z
    .string()
    .optional()
    .describe(
      "The category or subject area of the course (e.g. 'Engineering', 'Design').",
    ),
  tags: z
    .array(z.string())
    .optional()
    .describe("Optional tags for filtering and discovery."),
  mode: z
    .enum(CourseMode)
    .optional()
    .describe(
      "LESSON for a course that holds exactly one lesson and opens straight into it. Defaults to COURSE.",
    ),
  notebookId: z
    .string()
    .optional()
    .describe(
      "The ID of the notebook this course is being generated from. Include this when creating a course from notebook sources.",
    ),
});

export const createLessonSchema = z.object({
  courseId: z.string().describe("The ID of the course to add the lesson to."),
  title: z.string().min(1).describe("The title of the lesson."),
  description: lessonDescriptionSchema
    .optional()
    .describe("A short description of what this lesson covers."),
  icon: z
    .enum(LessonIcon)
    .optional()
    .describe("Visual icon for the lesson on the course path."),
  estimatedTimeToCompleteMinutes: z
    .number()
    .min(0)
    .optional()
    .describe("Estimated time to complete the lesson in minutes."),
});

export const updateCourseSchema = z
  .object({
    courseId: z.string(),
  })
  // eslint-disable-next-line anti-slop/no-shape-in-symbol-names -- Zod's own API for reading an object schema's fields; not a name we chose.
  .extend(updateCourseUpdatesSchema.shape);

export const updateLessonSchema = z
  .object({
    courseId: z.string(),
    lessonId: z.string(),
  })
  .merge(updateLessonUpdatesSchema);

export const getDashboardAnalyticsSchema = z.object({
  courseId: z.string(),
  timeRange: z.enum(["7d", "30d", "90d", "all"]).default("7d"),
  lessonId: z.string().optional(),
  sceneId: z.string().optional(),
  versionId: z.string().optional(),
});

export const getBlockAnalyticsSchema = z.object({
  courseId: z.string(),
  sceneId: z.string(),
});

export const getPreviewSchema = z.object({ courseId: z.string() });

export const getPreviewSceneContentSchema = z.object({
  courseId: z.string(),
  sceneId: z.string(),
});

export const getPublicSceneContentSchema = getPreviewSceneContentSchema.extend({
  courseVersionId: z.string(),
});

export const enrollMembersSchema = z.object({
  courseId: z.string(),
  userIds: z.array(z.string()).min(1).max(100),
  dueDate: z.coerce.date().optional().nullable(),
});

export const removeEnrollmentSchema = z.object({
  courseId: z.string(),
  userId: z.string(),
});

export const getLessonSchema = z.object({
  courseId: z.string(),
  lessonId: z.string(),
});

export const updateLessonOrderSchema = z.object({
  courseId: z.string(),
  lessonIds: z.array(z.string()).max(500),
});

export const deleteLessonSchema = z.object({
  courseId: z.string(),
  lessonIds: deletionIdsSchema,
});

export const resolveLessonDeletionSchema = z.object({
  lessonIds: deletionIdsSchema,
});

export const deleteCourseSchema = z.object({ courseId: z.string() });

export const publishCourseSchema = z.object({
  courseId: z.string(),
  supersedePrevious: z.boolean().default(false),

  force: z.boolean().default(false),
});

export const getPublicCourseSchema = z.object({ courseId: z.string() });

export const getOutdatedScenesSchema = z.object({
  courseId: z
    .string()
    .describe("The ID of the course to check for outdated scenes."),
});

export const getStaleSourcesForNotebookSchema = z.object({
  notebookId: z.string(),
});

export const linkNotebookSchema = z.object({
  courseId: z.string(),
  notebookId: z.string(),
});
