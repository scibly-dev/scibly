import type { NotebookRuntimeContext } from "@/features/notebook/server";

import { tool } from "ai";

import { serializeToolResult } from "@/shared/ai/tools/serialize-tool-result";

import {
  getDashboardStatsSchema,
  listEnrolledCoursesSchema,
} from "../api/schemas";

export function buildLearningNotebookTools(ctx: NotebookRuntimeContext) {
  return {
    getDashboardStats: tool({
      description:
        "Get learning dashboard statistics, including completion rates and enrolled counts.",
      inputSchema: getDashboardStatsSchema,
      execute: async (input) =>
        serializeToolResult(await ctx.caller.learning.getDashboardStats(input)),
    }),
    listEnrolledCourses: tool({
      description: "List courses a user is enrolled in.",
      inputSchema: listEnrolledCoursesSchema,
      execute: async (input) =>
        serializeToolResult(
          await ctx.caller.learning.listEnrolledCourses(input),
        ),
    }),
  };
}
