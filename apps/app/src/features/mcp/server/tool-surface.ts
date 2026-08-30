import type { buildToolRegistry } from "@/features/notebook/server";

import { z } from "zod";

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

// `sourceIds` never crosses the boundary (ADR 0005), `html` goes through
// `insertContent` instead, and `courseVersionId` names a published version
// while this surface is draft-only.
const UNREACHABLE_KEYS = ["html", "sourceIds", "courseVersionId"];

export function mcpToolInput(inputSchema: unknown) {
  if (!(inputSchema instanceof z.ZodObject)) {
    throw new Error("An MCP tool must declare a zod object input schema.");
  }

  // eslint-disable-next-line anti-slop/no-shape-in-symbol-names -- zod owns this property name; only our alias is ours to pick.
  const fields: Record<string, z.ZodType> = inputSchema.shape;

  return z.object(
    Object.fromEntries(
      Object.entries(fields).filter(([key]) => !UNREACHABLE_KEYS.includes(key)),
    ),
  );
}
