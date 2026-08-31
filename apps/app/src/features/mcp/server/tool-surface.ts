import type { buildToolRegistry } from "@/features/notebook/server";

import { z } from "zod";

import { createSceneSchema } from "@/features/course-authoring/server";

/** Deletes never join this list: the in-app confirmation gate has no MCP equivalent. */
export const MCP_TOOL_NAMES = [
  "createCourse",
  "listCourses",
  "getCourseById",
  "createLesson",
  "updateLesson",
  "reorderLessons",
  "listLessons",
  "createScene",
  "updateScene",
  "reorderScenes",
  "listScenes",
  "getEditorSchema",
  "getCourseStats",
  "listEnrollments",
  "getAvailableMembers",
  "getOrganization",
  "listMyOrganizations",
  "listMembers",
  "listInvitations",
  "getDashboardStats",
  "listEnrolledCourses",
  "loadSkill",
] as const satisfies readonly (keyof Awaited<
  ReturnType<typeof buildToolRegistry>
>)[];

export function mcpToolInput(
  name: (typeof MCP_TOOL_NAMES)[number],
  inputSchema: unknown,
): z.ZodObject {
  if (!(inputSchema instanceof z.ZodObject)) {
    throw new Error("An MCP tool must declare a zod object input schema.");
  }
  // An external agent has no notebook, so any lineage it cited would be
  // fiction (ADR 0005). `.omit` is checked against the schema, so renaming the
  // field breaks the build instead of silently re-opening it.
  return name === "createScene"
    ? createSceneSchema.omit({ sourceIds: true })
    : inputSchema;
}
