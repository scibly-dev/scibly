import { z } from "zod";

const deletionReasonSchema = z
  .string()
  .min(1)
  .max(500)
  .describe(
    "Brief explanation shown to the user in the confirmation dialog (e.g. why this content should be removed).",
  );

const deletionSceneItemSchema = z.object({
  sceneId: z
    .string()
    .describe(
      "Draft scene ID to delete. Must be the exact `id` field from listScenes — never invent IDs.",
    ),
  title: z.string().optional().describe("Scene title for the confirmation UI."),
  lessonId: z
    .string()
    .optional()
    .describe(
      "Parent lesson ID — used to focus the lesson in the course builder.",
    ),
  lessonTitle: z
    .string()
    .optional()
    .describe("Parent lesson title for the confirmation UI."),
});

export const agentDeleteScenesSchema = z.object({
  courseId: z
    .string()
    .describe("The ID of the course containing these scenes."),
  reason: deletionReasonSchema.optional(),
  scenes: z
    .array(deletionSceneItemSchema)
    .min(1)
    .max(30)
    .describe(
      "One or more draft scenes to delete in a single confirmation. " +
        "Pass every scene in one call when removing multiple scenes.",
    ),
});

const deletionLessonItemSchema = z.object({
  lessonId: z.string().describe("Lesson ID to delete."),
  title: z
    .string()
    .optional()
    .describe("Lesson title for the confirmation UI."),
});

export const agentDeleteLessonsSchema = z.object({
  courseId: z.string().describe("The ID of the course."),
  reason: deletionReasonSchema.optional(),
  lessons: z
    .array(deletionLessonItemSchema)
    .min(1)
    .max(30)
    .describe(
      "One or more lessons to delete in a single confirmation. " +
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
