import { AppError } from "@scibly/api/application-error";
import { protectedProcedure } from "@scibly/api/trpc";
import { db } from "@scibly/db";
import { type z } from "zod";

import {
  listMembersAndInvitationsSchema,
  listMembersSchema,
} from "./organization.schema";

async function requireMembership(organizationId: string, userId: string) {
  const membership = await db.member.findFirst({
    where: { organizationId, userId },
  });
  if (!membership) {
    throw new AppError({
      code: "FORBIDDEN",
      applicationCode: "api.forbidden",
      message: "You do not have access to this organization.",
    });
  }
  return membership;
}

const ROLE_RANK = new Map([
  ["owner", 3],
  ["admin", 2],
  ["member", 1],
]);

type ListInput = z.infer<typeof listMembersAndInvitationsSchema>;

function buildListFilters(input: ListInput) {
  const role = input.role && input.role !== "all" ? input.role : undefined;
  return {
    memberWhere: {
      organizationId: input.organizationId,
      role,
      user: input.search
        ? {
            OR: [
              {
                email: {
                  contains: input.search,
                  mode: "insensitive" as const,
                },
              },
              {
                name: { contains: input.search, mode: "insensitive" as const },
              },
            ],
          }
        : undefined,
    },
    invitationWhere: {
      organizationId: input.organizationId,
      status: "pending" as const,
      role,
      email: input.search
        ? { contains: input.search, mode: "insensitive" as const }
        : undefined,
    },
  };
}

async function loadListRecords(input: ListInput) {
  const { memberWhere, invitationWhere } = buildListFilters(input);
  const includeMembers = input.status === "all" || input.status === "active";
  const includeInvitations =
    input.status === "all" || input.status === "invited";
  const take = (input.cursor ?? 0) + input.limit + 1;
  return Promise.all([
    includeMembers
      ? db.member.findMany({
          where: memberWhere,
          include: { user: true },
          orderBy: [{ createdAt: "desc" }, { id: "asc" }],
          take,
        })
      : [],
    includeInvitations
      ? db.invitation.findMany({
          where: invitationWhere,
          orderBy: [{ createdAt: "desc" }, { id: "asc" }],
          take,
        })
      : [],
    includeMembers ? db.member.count({ where: memberWhere }) : 0,
    includeInvitations ? db.invitation.count({ where: invitationWhere }) : 0,
  ]);
}

async function listMembersAndInvitations(input: ListInput, userId: string) {
  await requireMembership(input.organizationId, userId);
  const [members, invitations, totalMembers, totalInvitations] =
    await loadListRecords(input);
  const combined = [
    ...members.map((member) => ({
      id: member.id,
      userId: member.userId,
      email: member.user.email,
      name: member.user.name,
      image: member.user.image,
      role: member.role,
      status: "active" as const,
      createdAt: member.createdAt,
    })),
    ...invitations.map((invitation) => ({
      id: invitation.id,
      userId: null,
      email: invitation.email,
      name: null,
      image: null,
      role: invitation.role ?? "member",
      status: "invited" as const,
      createdAt: invitation.createdAt,
    })),
  ];
  combined.sort((left, right) => {
    const leftIsUser = left.userId === userId;
    const rightIsUser = right.userId === userId;
    if (leftIsUser !== rightIsUser) return leftIsUser ? -1 : 1;
    const roleDifference =
      (ROLE_RANK.get(right.role) ?? 0) - (ROLE_RANK.get(left.role) ?? 0);
    return (
      roleDifference || right.createdAt.getTime() - left.createdAt.getTime()
    );
  });
  const offset = input.cursor ?? 0;
  const items = combined.slice(offset, offset + input.limit + 1);
  const nextCursor =
    items.length > input.limit
      ? (items.pop(), offset + input.limit)
      : undefined;
  return { items, nextCursor, totalCount: totalMembers + totalInvitations };
}

export const organizationMemberProcedures = {
  listMembers: protectedProcedure
    .input(listMembersSchema)
    .query(async ({ input, ctx }) => {
      await requireMembership(input.organizationId, ctx.session.user.id);
      return db.member.findMany({
        where: { organizationId: input.organizationId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });
    }),

  listMembersAndInvitations: protectedProcedure
    .input(listMembersAndInvitationsSchema)
    .query(({ input, ctx }) =>
      listMembersAndInvitations(input, ctx.session.user.id),
    ),
};
