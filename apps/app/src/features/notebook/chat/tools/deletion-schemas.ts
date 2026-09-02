import { z } from "zod";

import {
  deletionIdsSchema,
  deletionReasonSchema,
} from "@/features/course-authoring/contracts";

const reasonSchema = deletionReasonSchema
  .optional()
  .describe(
    "Brief explanation shown to the user in the approval card (e.g. why this content should be removed).",
  );

export const agentDeleteScenesSchema = z.object({
  courseId: z
    .string()
    .describe("The ID of the course containing these scenes."),
  reason: reasonSchema,
  sceneIds: deletionIdsSchema.describe(
    "Draft scene IDs to delete, exactly as listScenes returned them — never invent IDs. " +
      "Pass every scene in one call when removing multiple scenes.",
  ),
});

export const agentDeleteLessonsSchema = z.object({
  courseId: z.string().describe("The ID of the course."),
  reason: reasonSchema,
  lessonIds: deletionIdsSchema.describe(
    "Lesson IDs to delete, exactly as listLessons returned them. " +
      "Pass every lesson in one call when removing multiple lessons.",
  ),
});

export type AgentDeleteScenesInput = z.infer<typeof agentDeleteScenesSchema>;
export type AgentDeleteLessonsInput = z.infer<typeof agentDeleteLessonsSchema>;

export const agentDeleteScenesOutputSchema = z.object({
  success: z.literal(true),
  courseId: z.string(),
  deleted: z.array(
    z.object({
      sceneId: z.string(),
      title: z.string().optional(),
      lessonTitle: z.string().optional(),
      lessonId: z.string().optional(),
      courseId: z.string().optional(),
    }),
  ),
});

export const agentDeleteLessonsOutputSchema = z.object({
  success: z.literal(true),
  courseId: z.string(),
  deletedLessonIds: z.array(z.string()),
  deletedLessons: z.array(
    z.object({
      lessonId: z.string(),
      title: z.string().optional(),
    }),
  ),
});
