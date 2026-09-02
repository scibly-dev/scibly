import type { McpServer } from "@modelcontextprotocol/server";

import "server-only";
import {
  updateCourse,
  updateCourseSchema,
} from "@/features/course-authoring/server";

import { readable, text } from "./tool-response";

// Public access goes through setCoursePublic, which asks the author first.
const updateCourseInputSchema = updateCourseSchema.omit({
  allowAnonymous: true,
});

export function registerCourseTools(server: McpServer, userId: string) {
  server.registerTool(
    "updateCourse",
    {
      description:
        "Change a course's details: title, description, category, tags, thumbnail, pass mark, attempt limit or mode. " +
        "Only the fields you pass change; the rest are left alone, and null clears a value. " +
        "Edits the draft, so learners see none of it until publishCourse runs. " +
        "Public access is not set here — that is setCoursePublic, which asks the author first.",
      inputSchema: updateCourseInputSchema,
      annotations: { idempotentHint: true },
    },
    async (input) =>
      text(await readable("updateCourse", () => updateCourse(userId, input))),
  );
}
