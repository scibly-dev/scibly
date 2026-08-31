import { z } from "zod";

import { updateSceneUpdatesSchema } from "@/shared/content/course/scene-validation";

const sourceIdsSchema = z
  .array(z.string())
  .min(1)
  .max(50)
  .describe(
    "NotebookSource IDs this scene content was grounded in. Required when writing source-based content.",
  );

export const getLessonScenesSchema = z.object({
  lessonId: z.string(),
});

export const updateSceneSchema = z.object({
  sceneId: z.string().describe("The ID of the scene to update."),
  updates: updateSceneUpdatesSchema
    .optional()
    .describe("Metadata updates like title, vibe, animation, sp, etc."),
});

export const createSceneSchema = z.object({
  lessonId: z.string().describe("The ID of the lesson to create the scene in."),
  title: z
    .string()
    .optional()
    .describe(
      "The title of the scene. Defaults to 'New Scene' if not provided.",
    ),
  sourceIds: sourceIdsSchema.optional(),
});

export const setSceneLineageSchema = z.object({
  sceneId: z
    .string()
    .describe("The ID of the draft scene to record source lineage for."),
  sourceIds: sourceIdsSchema,
  notebookId: z
    .string()
    .optional()
    .describe(
      "Active notebook context. When the course is not yet linked to this notebook, linking is performed automatically before recording lineage.",
    ),
});

export const writeSceneContentSchema = z.object({
  sceneId: z.string().describe("The ID of the draft scene to write to."),
  html: z
    .string()
    .describe(
      "HTML conforming to the editor schema (call get_editor_schema first).",
    ),
  mode: z
    .enum(["replace", "append"])
    .default("replace")
    .describe(
      "Whether the HTML replaces the scene's content or is added after it.",
    ),
});

export const getSceneContentSchema = z.object({
  sceneId: z.string().describe("The ID of the scene to read content from."),
});

export const deleteSceneSchema = z.object({
  sceneIds: z.array(z.string()).min(1).max(30),
});

export const getDeletionNavigationContextSchema = z.object({
  sceneIds: z.array(z.string()).min(1).max(30),
});

export const cloneSceneSchema = z.object({
  sceneId: z.string().describe("The ID of the draft scene to duplicate."),
});

export const reorderScenesSchema = z.object({
  lessonId: z.string(),
  sceneIds: z.array(z.string()).max(200),
});
