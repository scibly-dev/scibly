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
  "listMembers",
  "listInvitations",
  "getDashboardStats",
  "listEnrolledCourses",
  "loadSkill",
] as const satisfies readonly (keyof Awaited<
  ReturnType<typeof buildToolRegistry>
>)[];

// `html` writes straight into the document the collaborative writer owns, and
// `sourceIds` starts lineage no external scene ever gets (ADR 0005).
const UNREACHABLE_KEYS = ["html", "sourceIds"];

export type OrgScope = { orgSlug: string; organizationId: string };

export function scopeToolInput(inputSchema: unknown, scope: OrgScope) {
  if (!(inputSchema instanceof z.ZodObject)) {
    throw new Error("An MCP tool must declare a zod object input schema.");
  }

  // eslint-disable-next-line anti-slop/no-shape-in-symbol-names -- zod owns this property name; only our alias is ours to pick.
  const fields: Record<string, z.ZodType> = inputSchema.shape;

  // Tools disagree on what to call the organization, hence three keys for one.
  const inject = Object.fromEntries(
    Object.entries({
      orgSlug: scope.orgSlug,
      slug: scope.orgSlug,
      organizationId: scope.organizationId,
    }).filter(([key]) => key in fields),
  );

  const dropped = new Set([...Object.keys(inject), ...UNREACHABLE_KEYS]);

  return {
    schema: z.object(
      Object.fromEntries(
        Object.entries(fields).filter(([key]) => !dropped.has(key)),
      ),
    ),
    inject,
  };
}
