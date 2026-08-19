import type { NotebookRuntimeContext } from "@/features/notebook/server";

import { tool } from "ai";
import { type z } from "zod";

import { serializeToolResult } from "@/shared/ai/tools/serialize-tool-result";

import {
  getAvailableMembersSchema,
  getCourseStatsSchema,
  getOutdatedScenesSchema,
  listEnrollmentsSchema,
} from "../courses/api/course.schema";

async function loadOutdatedSceneReview(
  context: NotebookRuntimeContext,
  input: z.infer<typeof getOutdatedScenesSchema>,
) {
  const result = await context.caller.course.getOutdatedScenes(input);
  if (!result.hasOutdatedScenes) {
    return {
      ...result,
      reviewGuidance:
        "No draft scenes are flagged isOutdated right now. If the user reports a recent source re-sync, still check the source material yourself before saying so.",
    };
  }
  return {
    ...result,
    reviewGuidance:
      "Each listed scene must be reviewed with getSceneContent against the source material. " +
      "Do not claim the course is up to date or that nothing changed until every outdated scene has been compared against what the sources say now.",
    requiredSteps: [
      "Load the scene-content skill",
      "For each outdated scene: getSceneContent → consult the source material → compare scene HTML against it",
      "Regenerate with insertContent (with sourceIds), or deleteScenes (with a clear reason) when source material is gone — use deleteLessons when the lesson has only one scene. The chat UI handles confirmation; do not ask in plain text.",
      "Load the review-check skill afterward to confirm the whole course is current.",
    ],
  };
}

export function buildReviewTools(context: NotebookRuntimeContext) {
  return {
    getOutdatedScenes: tool({
      description:
        "Authoritative outdated state for a course. Returns hasOutdatedScenes (true when any draft scene has isOutdated), " +
        "outdatedSceneCount, the scene list, and reviewGuidance. If hasOutdatedScenes is true, the course is NOT fully up to date. " +
        "Call before answering questions about course validity/freshness, after source re-syncs, and before running invalidation. " +
        "When scenes are outdated, compare each one against the source material before reporting on it.",
      inputSchema: getOutdatedScenesSchema,
      execute: async (input) => loadOutdatedSceneReview(context, input),
    }),
    getCourseStats: tool({
      description:
        "Get enrollment and completion statistics for a specific course.",
      inputSchema: getCourseStatsSchema,
      execute: async (input) => context.caller.course.getStats(input),
    }),
    listEnrollments: tool({
      description: "List learners enrolled in a specific course.",
      inputSchema: listEnrollmentsSchema,
      execute: async (input) =>
        serializeToolResult(await context.caller.course.listEnrollments(input)),
    }),
    getAvailableMembers: tool({
      description:
        "List organization members who are NOT yet enrolled in a specific course.",
      inputSchema: getAvailableMembersSchema,
      execute: async (input) =>
        context.caller.course.getAvailableMembers(input),
    }),
  };
}
