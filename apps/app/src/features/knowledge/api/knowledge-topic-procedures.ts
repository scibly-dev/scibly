import type { TopicRepository } from "../contracts";
import type { TopicRepositoryInput } from "./knowledge.schema";

import { AppError } from "@scibly/api/application-error";
import {
  assertAllowed,
  decideKnowledgeSync,
  describeKnowledgeSyncAccess,
} from "@scibly/api/entitlement";
import { withRateLimit } from "@scibly/api/rate-limit";
import { protectedProcedure } from "@scibly/api/trpc";
import { db, Prisma } from "@scibly/db";

import { resolveConnection } from "@/features/integrations/server";
import { resolveOrg } from "@/features/organizations/server";

import {
  createTopicSchema,
  deleteTopicSchema,
  listFoldersSchema,
  orgSlugInput,
  parseStoredRepositories,
  toStoredRepositories,
  updateTopicSchema,
} from "./knowledge.schema";

const TOPIC_SELECT = {
  id: true,
  name: true,
  repositories: true,
  language: true,
  createdAt: true,
  updatedAt: true,
  maintainers: {
    select: { id: true, user: { select: { name: true, email: true } } },
  },
} as const;

type StoredTopic = Prisma.KnowledgeTopicGetPayload<{
  select: typeof TOPIC_SELECT;
}>;

const NEVER_SYNCED = { lastSyncedAt: null, pendingSuggestions: 0 };

const FOLDERS_LIMIT = {
  endpoint: "knowledge.listFolders",
  maxPerWindow: 120,
  tooManyRequestsMessage:
    "Too many folder listings. Please try again in a bit.",
} as const;

const toTopicView = <T extends StoredTopic>({
  repositories,
  maintainers,
  ...topic
}: T) => ({
  ...topic,
  repositories: parseStoredRepositories(repositories),
  maintainers: maintainers.map(({ id, user }) => ({
    memberId: id,
    name: user.name,
    email: user.email,
  })),
  ...NEVER_SYNCED,
});

const topicNotFound = () =>
  new AppError({
    code: "NOT_FOUND",
    applicationCode: "api.not_found",
    message: "No such knowledge topic in this organization.",
  });

const badScope = (message: string) =>
  new AppError({
    code: "BAD_REQUEST",
    applicationCode: "knowledge.invalid_scope",
    message,
  });

const unreachableRepository = (id: string) =>
  badScope(
    `Repository ${id} is not one this organization's GitHub installation reaches.`,
  );

async function resolveRepositories(
  organizationId: string,
  repositories: TopicRepositoryInput[],
) {
  const { provider, token } = await resolveConnection(organizationId, "GITHUB");
  const { grants, totalCount } = (await provider.listGrants?.(token)) ?? {
    grants: [],
    totalCount: 0,
  };
  const nameById = new Map(grants.map((grant) => [grant.id, grant.name]));
  const listedEverything = grants.length >= totalCount;

  const unique = [
    ...new Map(repositories.map((repo) => [repo.id, repo])).values(),
  ];
  // Sequential, not `Promise.all`: a truncated listing can leave fifty ids to resolve, and GitHub answers that burst with a rate limit.
  const settled: TopicRepository[] = [];
  for (const { id, pathGlobs } of unique) {
    const fullName =
      nameById.get(id) ??
      (listedEverything
        ? undefined
        : (await provider.resolveGrant?.(token, id))?.name);
    if (!fullName) throw unreachableRepository(id);
    settled.push({ id, fullName, pathGlobs });
  }
  return { repositories: settled };
}

async function resolveMaintainers(
  organizationId: string,
  maintainerMemberIds: string[],
) {
  const ids = [...new Set(maintainerMemberIds)];
  if (ids.length === 0) return [];

  const members = await db.member.findMany({
    where: { id: { in: ids }, organizationId },
    select: { id: true },
  });
  if (members.length !== ids.length) {
    throw badScope("A maintainer must be a member of this organization.");
  }
  return members.map(({ id }) => ({ id }));
}

async function writeTopic<T>(write: () => Promise<T>): Promise<T> {
  try {
    return await write();
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError({
        code: "CONFLICT",
        applicationCode: "knowledge.name_taken",
        message: "A topic with this name already exists in this organization.",
      });
    }
    throw error;
  }
}

async function requireKnowledgeAdmin(orgSlug: string, userId: string) {
  const { organization } = await resolveOrg(orgSlug, userId, "admin_or_owner");
  assertAllowed(await decideKnowledgeSync(db, organization.id));
  return { organizationId: organization.id };
}

async function resolveTopicScope(
  organizationId: string,
  input: {
    repositories: TopicRepositoryInput[];
    maintainerMemberIds: string[];
  },
) {
  const [{ repositories }, maintainers] = await Promise.all([
    resolveRepositories(organizationId, input.repositories),
    resolveMaintainers(organizationId, input.maintainerMemberIds),
  ]);
  return { repositories, maintainers };
}

export const knowledgeTopicProcedures = {
  list: protectedProcedure.input(orgSlugInput).query(async ({ input, ctx }) => {
    const { organization, membership } = await resolveOrg(
      input.orgSlug,
      ctx.session.user.id,
      "member",
    );
    const [topics, access] = await Promise.all([
      db.knowledgeTopic.findMany({
        where: { organizationId: organization.id },
        select: TOPIC_SELECT,
        orderBy: { createdAt: "desc" },
      }),
      describeKnowledgeSyncAccess(db, organization.id),
    ]);

    return {
      organizationId: organization.id,
      topics: topics.map(toTopicView),
      access,
      canManage: membership.role === "admin" || membership.role === "owner",
    };
  }),

  listFolders: protectedProcedure
    .input(listFoldersSchema)
    .query(async ({ input, ctx }) => {
      const { organizationId } = await requireKnowledgeAdmin(
        input.orgSlug,
        ctx.session.user.id,
      );

      return withRateLimit(
        { db, identifier: ctx.session.user.id, ...FOLDERS_LIMIT },
        async () => {
          const { provider, token } = await resolveConnection(
            organizationId,
            "GITHUB",
          );
          if (!(await provider.resolveGrant?.(token, input.repositoryId))) {
            throw unreachableRepository(input.repositoryId);
          }
          return {
            folders:
              (await provider.listFolders?.(token, input.repositoryId)) ?? [],
          };
        },
      );
    }),

  create: protectedProcedure
    .input(createTopicSchema)
    .mutation(async ({ input, ctx }) => {
      const { organizationId } = await requireKnowledgeAdmin(
        input.orgSlug,
        ctx.session.user.id,
      );
      const { repositories, maintainers } = await resolveTopicScope(
        organizationId,
        input,
      );

      const topic = await writeTopic(() =>
        db.knowledgeTopic.create({
          data: {
            organizationId,
            name: input.name,
            repositories: toStoredRepositories(repositories),
            language: input.language,
            maintainers: { connect: maintainers },
          },
          select: TOPIC_SELECT,
        }),
      );
      return toTopicView(topic);
    }),

  update: protectedProcedure
    .input(updateTopicSchema)
    .mutation(async ({ input, ctx }) => {
      const { organizationId } = await requireKnowledgeAdmin(
        input.orgSlug,
        ctx.session.user.id,
      );

      const existing = await db.knowledgeTopic.findFirst({
        where: { id: input.topicId, organizationId },
        select: { id: true },
      });
      if (!existing) throw topicNotFound();

      const { repositories, maintainers } = await resolveTopicScope(
        organizationId,
        input,
      );

      const topic = await writeTopic(() =>
        db.knowledgeTopic.update({
          where: { id: existing.id },
          data: {
            name: input.name,
            repositories: toStoredRepositories(repositories),
            language: input.language,
            maintainers: { set: maintainers },
          },
          select: TOPIC_SELECT,
        }),
      );
      return toTopicView(topic);
    }),

  delete: protectedProcedure
    .input(deleteTopicSchema)
    .mutation(async ({ input, ctx }) => {
      // No plan gate: a lapsed subscription blocks writes, but an organization's own data stays theirs to remove.
      const { organization } = await resolveOrg(
        input.orgSlug,
        ctx.session.user.id,
        "admin_or_owner",
      );
      const organizationId = organization.id;

      const { count } = await db.knowledgeTopic.deleteMany({
        where: { id: input.topicId, organizationId },
      });
      if (count === 0) throw topicNotFound();
      return { success: true };
    }),
};
