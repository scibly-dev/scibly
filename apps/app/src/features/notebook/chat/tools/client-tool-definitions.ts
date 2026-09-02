import { tool } from "ai";
import { z } from "zod";

import { buildApprovalToolDescription } from "./approval-description";
import {
  agentDeleteLessonsOutputSchema,
  agentDeleteLessonsSchema,
  agentDeleteScenesOutputSchema,
  agentDeleteScenesSchema,
} from "./deletion-schemas";
import {
  askMultipleChoiceInputSchema,
  askMultipleChoiceOutputSchema,
  proposePlanInputSchema,
  proposePlanOutputSchema,
} from "./ux-tools";

type ApprovalGatedToolName = "deleteScenes" | "deleteLessons";
export type UxClientToolName = "askMultipleChoice" | "proposePlan";

export const APPROVAL_GATED_TOOL_NAMES = [
  "deleteScenes",
  "deleteLessons",
] as const satisfies readonly ApprovalGatedToolName[];

export function isApprovalGatedTool(
  toolName: string,
): toolName is ApprovalGatedToolName {
  return APPROVAL_GATED_TOOL_NAMES.some((name) => name === toolName);
}

export function isClientExecutedTool(toolName: string): boolean {
  return toolName in CLIENT_ONLY_NOTEBOOK_TOOLS;
}

// SAFETY: one entry per name in `APPROVAL_GATED_TOOL_NAMES`, which is what
// `ApprovalGatedToolName` is the union of.
export const APPROVAL_GATED_TOOL_APPROVAL = Object.fromEntries(
  APPROVAL_GATED_TOOL_NAMES.map((toolName) => [toolName, "user-approval"]),
) as Record<ApprovalGatedToolName, "user-approval">;

// Deliberately no `execute` — the browser owns rich text editing, UX prompts, and user-approved destructive actions.
export const CLIENT_ONLY_NOTEBOOK_TOOLS = {
  insertContent: tool({
    description:
      "Inserts HTML content into a scene's editor. " +
      "Must be formatted as valid HTML string according to the schema provided by getEditorSchema.",
    inputSchema: z.object({
      sceneId: z
        .string()
        .optional()
        .describe(
          "The ID of the scene to insert content into. If omitted, defaults to the currently active scene.",
        ),
      html: z
        .string()
        .describe("The exact HTML string to insert into the editor"),
      sourceIds: z
        .array(z.string())
        .min(1)
        .optional()
        .describe(
          "NotebookSource IDs this scene content was grounded in. Required when writing source-based content. " +
            "When editing existing content, include prior sourceIds from getSceneContent if that content is preserved, plus any new sources used.",
        ),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      html: z.string(),
      error: z.string().optional(),
      lineageWarning: z.string().optional(),
      groundingWarning: z.string().optional(),
      qualityWarning: z.string().optional(),
    }),
  }),
  getSceneContent: tool({
    description:
      "Read the full HTML content of a scene editor. " +
      "Also returns `sourceIds` — notebook sources this scene was previously grounded in. " +
      "When extending or editing existing content, pass any still-relevant `sourceIds` alongside new ones to `insertContent`.",
    inputSchema: z.object({
      sceneId: z
        .string()
        .optional()
        .describe(
          "The ID of the scene to read. If omitted, defaults to the currently active scene.",
        ),
      reason: z
        .string()
        .optional()
        .describe("Why you need to read the scene content."),
    }),
    outputSchema: z.object({
      html: z.string().optional(),
      sceneId: z.string().optional(),
      sourceIds: z.array(z.string()),
      error: z.string().optional(),
    }),
  }),
  askMultipleChoice: tool({
    description:
      "Present clickable multiple-choice options in chat when a structured pick is faster than free text. " +
      "Use for decisions, preferences, scope, priorities, confirmations, or narrowing direction — " +
      "in course design, content planning, edits, or any time the answer fits a small set of options. " +
      "Always pass `questions` — 1 to 8 of them, answered back-to-back in one wizard. " +
      "Wait for the user's selection(s) before continuing.",
    inputSchema: askMultipleChoiceInputSchema,
    outputSchema: askMultipleChoiceOutputSchema,
  }),
  proposePlan: tool({
    description:
      "Present a structured plan in chat before taking significant action. " +
      "Use for course outlines, multi-step workflows, content restructuring, or any plan " +
      "where the user should confirm, reject, or refine the approach first. " +
      "Provide a clear title, optional summary, and ordered steps. " +
      "Wait for the user's decision before executing the plan.",
    inputSchema: proposePlanInputSchema,
    outputSchema: proposePlanOutputSchema,
  }),
  deleteLessons: tool({
    description: buildApprovalToolDescription(
      "Permanently delete one or more lessons and all their draft scenes. " +
        "Call this tool immediately when deletion is appropriate. Pass every lesson in one call when removing multiple lessons. " +
        "Use this when a lesson (or its only remaining scene) should be removed entirely — deleteScenes cannot remove the last scene in a lesson. " +
        "Use the exact lesson `id` from listLessons — Scibly looks up the titles it shows the user, so never send one. " +
        "Provide a shared reason when the user did not explicitly ask to delete",
    ),
    inputSchema: agentDeleteLessonsSchema,
    outputSchema: agentDeleteLessonsOutputSchema,
  }),
  deleteScenes: tool({
    description: buildApprovalToolDescription(
      "Permanently delete one or more draft scenes. " +
        "Call this tool immediately when deletion is appropriate. Pass every scene in one call when removing multiple scenes. " +
        "Include the course `courseId` from the active course context. " +
        "Every lesson must keep at least one scene — call listScenes first. " +
        "If a lesson has only one scene and the whole lesson should go, use deleteLessons instead. " +
        "Use the exact scene `id` from listScenes — never invent or guess IDs, and never send titles: Scibly looks up the names it shows the user. " +
        "If the deletion comes back denied because ids did not resolve, call listScenes and retry with corrected IDs. " +
        "Provide a shared reason when the user did not explicitly ask to delete",
    ),
    inputSchema: agentDeleteScenesSchema,
    outputSchema: agentDeleteScenesOutputSchema,
  }),
};
