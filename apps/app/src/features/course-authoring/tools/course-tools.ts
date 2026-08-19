import type { NotebookRuntimeContext } from "@/features/notebook/server";

import { tool } from "ai";

import { serializeToolResult } from "@/shared/ai/tools/serialize-tool-result";

import {
  createCourseSchema,
  getCourseByIdSchema,
  listCoursesSchema,
} from "../courses/api/course.schema";
import { writeCourseDelta } from "./tool-context";

const createCourseInputSchema = createCourseSchema.omit({ notebookId: true });

export function buildCourseTools(context: NotebookRuntimeContext) {
  return {
    createCourse: tool({
      description: "Create a new course inside the organization.",
      inputSchema: createCourseInputSchema,
      execute: async (input) => {
        const course = await context.caller.course.create({
          ...input,
          notebookId: context.notebookId,
        });
        writeCourseDelta(context, { type: "course-created", course });
        return serializeToolResult(course);
      },
    }),
    listCourses: tool({
      description:
        "List courses in the organization with optional search and pagination.",
      inputSchema: listCoursesSchema,
      execute: async (input) =>
        serializeToolResult(await context.caller.course.list(input)),
    }),
    getCourseById: tool({
      description:
        "Get detailed information about a specific course, including its lessons.",
      inputSchema: getCourseByIdSchema,
      execute: async (input) =>
        serializeToolResult(await context.caller.course.getById(input)),
    }),
  };
}
