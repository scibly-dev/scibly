import type { TopicRepository } from "../contracts";

import { AppError } from "@scibly/api/application-error";
import {
  assertAllowed,
  decideKnowledgeSync,
  describeKnowledgeSyncAccess,
} from "@scibly/api/entitlement";
import { protectedProcedure } from "@scibly/api/trpc";
import { db } from "@scibly/db";

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

type StoredTopic = {
  repositories: unknown;
  maintainers: { id: string; user: { name: string; email: string } }[];
};

// Health has nowhere to come from until the sync tickets land, so it is stated
// as the constant it is rather than dressed up as a value that could vary. The
// ticket that starts syncing replaces this with the real columns.
const NEVER_SYNCED = { lastSyncedAt: null, pendingSuggestions: 0 };

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

// The repository ids arrive from a browser, so the installation — not the client
// — decides which repositories exist and what they are called. A repeated id
// keeps its first entry, so a duplicate cannot smuggle in a second glob set.
async function resolveRepositories(
  organizationId: string,
  repositories: { id: string; pathGlobs: string[] }[],
): Promise<TopicRepository[]> {
  const { provider, token } = await resolveConnection(organizationId, "GITHUB");
  const { grants } = (await provider.listGrants?.(token)) ?? { grants: [] };
  const nameById = new Map(grants.map((grant) => [grant.id, grant.name]));

  const unique = [
    ...new Map(repositories.map((repo) => [repo.id, repo])).values(),
  ];
  return unique.map(({ id, pathGlobs }) => {
    const fullName = nameById.get(id);
    if (!fullName) {
      throw badScope(
        `Repository ${id} is not one this organization's GitHub installation reaches.`,
      );
    }
    return { id, fullName, pathGlobs };
  });
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

// Everything a write needs, gathered once: the admin check, the plan gate, and
// the two scopes the client is not trusted to state.
async function prepareTopicWrite(
  input: {
    orgSlug: string;
    repositories: { id: string; pathGlobs: string[] }[];
    maintainerMemberIds: string[];
  },
  userId: string,
) {
  const { organization } = await resolveOrg(
    input.orgSlug,
    userId,
    "admin_or_owner",
  );
  assertAllowed(await decideKnowledgeSync(db, organization.id));

  const [repositories, maintainers] = await Promise.all([
    resolveRepositories(organization.id, input.repositories),
    resolveMaintainers(organization.id, input.maintainerMemberIds),
  ]);
  return { organizationId: organization.id, repositories, maintainers };
}

export const knowledgeTopicProcedures = {
  // Open to any member: the gate decides what the page offers, not whether it
  // renders at all.
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
      // Carried here so the screen needs no organization lookup of its own just
      // to name the members a maintainer can be picked from.
      organizationId: organization.id,
      topics: topics.map(toTopicView),
      access,
      canManage: membership.role === "admin" || membership.role === "owner",
    };
  }),

  // Named so nobody has to guess a path: the folders come from the installation,
  // and the same admin check and gate guard them as the write they feed.
  listFolders: protectedProcedure
    .input(listFoldersSchema)
    .query(async ({ input, ctx }) => {
      const { organization } = await resolveOrg(
        input.orgSlug,
        ctx.session.user.id,
        "admin_or_owner",
      );
      assertAllowed(await decideKnowledgeSync(db, organization.id));

      // Settled against the installation first, so an id from a browser cannot
      // ask about a repository this organization does not reach.
      await resolveRepositories(organization.id, [
        { id: input.repositoryId, pathGlobs: [] },
      ]);
      const { provider, token } = await resolveConnection(
        organization.id,
        "GITHUB",
      );
      return {
        folders:
          (await provider.listFolders?.(token, input.repositoryId)) ?? [],
      };
    }),

  create: protectedProcedure
    .input(createTopicSchema)
    .mutation(async ({ input, ctx }) => {
      const { organizationId, repositories, maintainers } =
        await prepareTopicWrite(input, ctx.session.user.id);

      const topic = await db.knowledgeTopic.create({
        data: {
          organizationId,
          name: input.name,
          repositories: toStoredRepositories(repositories),
          language: input.language,
          maintainers: { connect: maintainers },
        },
        select: TOPIC_SELECT,
      });
      return toTopicView(topic);
    }),

  update: protectedProcedure
    .input(updateTopicSchema)
    .mutation(async ({ input, ctx }) => {
      const { organizationId, repositories, maintainers } =
        await prepareTopicWrite(input, ctx.session.user.id);

      // Found within the organization first: a topic id from another tenant is
      // a miss, not something to update and then refuse.
      const existing = await db.knowledgeTopic.findFirst({
        where: { id: input.topicId, organizationId },
        select: { id: true },
      });
      if (!existing) throw topicNotFound();

      const topic = await db.knowledgeTopic.update({
        where: { id: existing.id },
        data: {
          name: input.name,
          repositories: toStoredRepositories(repositories),
          language: input.language,
          maintainers: { set: maintainers },
        },
        select: TOPIC_SELECT,
      });
      return toTopicView(topic);
    }),

  delete: protectedProcedure
    .input(deleteTopicSchema)
    .mutation(async ({ input, ctx }) => {
      const { organization } = await resolveOrg(
        input.orgSlug,
        ctx.session.user.id,
        "admin_or_owner",
      );
      assertAllowed(await decideKnowledgeSync(db, organization.id));

      const { count } = await db.knowledgeTopic.deleteMany({
        where: { id: input.topicId, organizationId: organization.id },
      });
      if (count === 0) throw topicNotFound();
      return { success: true };
    }),
};
