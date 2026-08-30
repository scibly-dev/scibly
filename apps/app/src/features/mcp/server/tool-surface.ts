import type { buildToolRegistry } from "@/features/notebook/server";

import { z } from "zod";

/**
 * Every tool an external agent may call; deletes never join it, the in-app
 * confirmation gate has no MCP equivalent.
 */
export const MCP_TOOL_NAMES = [
  "listCourses",
  "getCourseById",
  "listLessons",
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

export type OrgScope = { orgSlug: string; organizationId: string };

/**
 * The tool's schema minus the organization keys, plus the values to put back:
 * whatever an agent sends under those keys is discarded.
 */
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

  return {
    schema: z.object(
      Object.fromEntries(
        Object.entries(fields).filter(([key]) => !(key in inject)),
      ),
    ),
    inject,
  };
}
