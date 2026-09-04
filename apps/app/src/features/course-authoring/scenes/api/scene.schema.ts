import { z } from "zod";

import { updateSceneUpdatesSchema } from "@/shared/content/course/scene-validation";

import { deletionIdsSchema } from "../../deletion/api/deletion.schema";

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
  kind: z
    .enum(["DOCUMENT", "PRACTICE"])
    .optional()
    .describe(
      "Scene content type. DOCUMENT (default) holds rich-text/question content, edited via insertContent. " +
        "PRACTICE holds an interactive mini-app the learner operates (not a form of input fields), " +
        "edited via writePractice — call getPracticeContract first.",
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
  sceneIds: deletionIdsSchema,
});

export const resolveSceneDeletionSchema = z.object({
  sceneIds: deletionIdsSchema,
});

export const cloneSceneSchema = z.object({
  sceneId: z.string().describe("The ID of the draft scene to duplicate."),
});

export const reorderScenesSchema = z.object({
  lessonId: z.string(),
  sceneIds: z.array(z.string()).max(200),
});

const practiceSolutionFieldSchema = z.object({
  value: z.unknown().describe("The expected value for this field."),
  // A zero-point field can never be answered correctly (see isFieldCorrect).
  points: z
    .number()
    .positive()
    .describe("Points awarded when this field matches."),
  eps: z
    .number()
    .optional()
    .describe("Tolerance for a numeric value; ignored for non-numeric values."),
});

export const practiceSolutionSchema = z
  .record(z.string(), practiceSolutionFieldSchema)
  .nullable()
  .describe(
    "Answer key keyed by field id, matching the keys submit(work) will send. " +
      "null for an open-ended practice — no score, explanation only.",
  );

export const getPracticeSchema = z.object({
  sceneId: z.string().describe("The ID of the draft PRACTICE scene to read."),
});

export const writePracticeSchema = z.object({
  sceneId: z
    .string()
    .describe("The ID of the draft PRACTICE scene to write to."),
  html: z
    .string()
    // Generous for an app that pulls its libraries from a CDN; the column is otherwise unbounded.
    .max(500_000)
    .describe(
      "The practice app's HTML fragment. Call getPracticeContract first for the full contract.",
    ),
  solution: practiceSolutionSchema,
  explanation: z
    .string()
    .nullable()
    .describe(
      "Shown to the learner under the app with their result, whatever they scored — " +
        "the only feedback an exploratory (solution: null) scene gives.",
    ),
});

export const validatePracticeSchema = z.object({
  sceneId: z
    .string()
    .describe("The ID of the draft PRACTICE scene to validate against."),
  work: z
    .unknown()
    .describe(
      "The payload submit(work) would send — normally window.__sciblySelfTest()'s return value.",
    ),
});

/** `selfTest` stamps the publish gate, so only the editor — never MCP — can claim it. */
export const validatePracticeInputSchema = validatePracticeSchema.extend({
  selfTest: z.boolean().default(false),
});
