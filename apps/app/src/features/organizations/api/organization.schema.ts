import { z } from "zod";

export const deleteOrganizationSchema = z.object({
  organizationId: z.string(),
});

export const getOrganizationBySlugSchema = z.object({ slug: z.string() });

export const listMembersSchema = z.object({ organizationId: z.string() });

export const listInvitationsSchema = z.object({ organizationId: z.string() });

export const listMembersAndInvitationsSchema = z.object({
  organizationId: z.string(),
  limit: z.number().min(1).max(100).default(10),
  cursor: z.number().nullish(),
  search: z.string().optional(),
  role: z.string().optional(),
  status: z.enum(["active", "invited", "all"]).default("all"),
});

export const inviteMembersSchema = z.object({
  organizationId: z.string(),
  invites: z.array(
    z.object({
      email: z.string().email(),
      role: z.enum(["owner", "admin", "member"]),
    }),
  ),
});

export const acceptInvitationSchema = z.object({ invitationId: z.string() });
export const rejectInvitationSchema = z.object({ invitationId: z.string() });
