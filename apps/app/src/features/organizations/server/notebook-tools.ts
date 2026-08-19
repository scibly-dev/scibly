import type { NotebookRuntimeContext } from "@/features/notebook/server";

import { tool } from "ai";
import { z } from "zod";

import { serializeToolResult } from "@/shared/ai/tools/serialize-tool-result";

import {
  getOrganizationBySlugSchema,
  listInvitationsSchema,
  listMembersAndInvitationsSchema,
} from "../api/organization.schema";

export function buildOrganizationNotebookTools(ctx: NotebookRuntimeContext) {
  return {
    listMembers: tool({
      description: "List members and invitations for the organization.",
      inputSchema: listMembersAndInvitationsSchema,
      execute: async (input) =>
        serializeToolResult(
          await ctx.caller.organization.listMembersAndInvitations(input),
        ),
    }),
    listInvitations: tool({
      description: "List pending invitations for the organization.",
      inputSchema: listInvitationsSchema,
      execute: async (input) =>
        serializeToolResult(
          await ctx.caller.organization.listInvitations(input),
        ),
    }),
    getOrganization: tool({
      description: "Get organization details by slug.",
      inputSchema: getOrganizationBySlugSchema,
      execute: async (input) =>
        serializeToolResult(await ctx.caller.organization.getBySlug(input)),
    }),
    listMyOrganizations: tool({
      description: "List all organizations the user is a member of.",
      inputSchema: z.object({}),
      execute: async () =>
        serializeToolResult(await ctx.caller.organization.listMyOrgs()),
    }),
  };
}
