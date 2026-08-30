import {
  assertAllowed,
  decideKnowledgeSync,
  describeKnowledgeSyncAccess,
} from "@scibly/api/entitlement";
import { withRateLimit } from "@scibly/api/rate-limit";
import { protectedProcedure } from "@scibly/api/trpc";
import { db } from "@scibly/db";

import { resolveRepositoryConnection } from "@/features/integrations/server";
import { resolveOrg } from "@/features/organizations/server";

import {
  createTopicDocument,
  readDocumentDestination,
  republishTopicDocument,
  setDocumentDestination,
  topicSkeleton,
} from "../server/topic-document";
import {
  requireReachableRepository,
  resolveTopicScope,
} from "../server/topic-scope";
import {
  TOPIC_SELECT,
  topicNotFound,
  toTopicView,
  writeTopic,
} from "../server/topic-view";
import {
  createTopicSchema,
  deleteTopicSchema,
  listFoldersSchema,
  orgSlugInput,
  setDocumentDestinationSchema,
  updateTopicSchema,
} from "./knowledge.schema";

const FOLDERS_LIMIT = {
  endpoint: "knowledge.listFolders",
  maxPerWindow: 120,
  tooManyRequestsMessage:
    "Too many folder listings. Please try again in a bit.",
} as const;

const WRITE_LIMIT = {
  endpoint: "knowledge.writeTopic",
  maxPerWindow: 60,
  tooManyRequestsMessage: "Too many topic changes. Please try again in a bit.",
} as const;

async function requireKnowledgeAdmin(orgSlug: string, userId: string) {
  const { organization } = await resolveOrg(orgSlug, userId, "admin_or_owner");
  assertAllowed(await decideKnowledgeSync(db, organization.id));
  return { organizationId: organization.id };
}

export const knowledgeTopicProcedures = {
  list: protectedProcedure.input(orgSlugInput).query(async ({ input, ctx }) => {
    const { organization, membership } = await resolveOrg(
      input.orgSlug,
      ctx.session.user.id,
      "member",
    );
    const canManage =
      membership.role === "admin" || membership.role === "owner";
    const [topics, access, destination] = await Promise.all([
      db.knowledgeTopic.findMany({
        where: { organizationId: organization.id },
        select: TOPIC_SELECT,
        orderBy: { createdAt: "desc" },
      }),
      describeKnowledgeSyncAccess(db, organization.id),
      // Costs two Notion reads, so only those who can set it are told.
      canManage ? readDocumentDestination(organization.id) : null,
    ]);

    return {
      organizationId: organization.id,
      topics: topics.map(toTopicView),
      access,
      destination,
      canManage,
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
          const connection = await resolveRepositoryConnection(
            organizationId,
            "GITHUB",
          );
          await requireReachableRepository(connection, input.repositoryId);
          return {
            folders: await connection.provider.listFolders(
              connection.token,
              input.repositoryId,
            ),
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

      return withRateLimit(
        { db, identifier: ctx.session.user.id, ...WRITE_LIMIT },
        async () => {
          // ponytail: a name already taken leaves the page behind unreferenced —
          // pre-check the name if that litter ever bothers anyone.
          const markdown = topicSkeleton(input.language);
          const document = await createTopicDocument({
            organizationId,
            title: input.name,
            markdown,
          });

          const topic = await writeTopic(() =>
            db.knowledgeTopic.create({
              data: {
                organizationId,
                name: input.name,
                repositories,
                language: input.language,
                markdown,
                ...document.columns,
                maintainers: { connect: maintainers },
              },
              select: TOPIC_SELECT,
            }),
          );
          return toTopicView(topic);
        },
      );
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
        select: {
          id: true,
          markdown: true,
          notionPageId: true,
          notionRevisionAt: true,
        },
      });
      if (!existing) throw topicNotFound();

      const { repositories, maintainers } = await resolveTopicScope(
        organizationId,
        input,
      );

      return withRateLimit(
        { db, identifier: ctx.session.user.id, ...WRITE_LIMIT },
        async () => {
          // Row first: the name is what can be refused.
          await writeTopic(() =>
            db.knowledgeTopic.update({
              where: { id: existing.id },
              data: {
                name: input.name,
                repositories,
                language: input.language,
                maintainers: { set: maintainers },
              },
              select: { id: true },
            }),
          );

          const document = await republishTopicDocument({
            organizationId,
            topic: existing,
            title: input.name,
            markdown: existing.markdown,
          });

          const topic = await db.knowledgeTopic.update({
            where: { id: existing.id },
            data: document.columns,
            select: TOPIC_SELECT,
          });
          return toTopicView(topic);
        },
      );
    }),

  delete: protectedProcedure
    .input(deleteTopicSchema)
    .mutation(async ({ input, ctx }) => {
      // No plan gate: an organization's own data stays theirs to remove.
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

  setDocumentDestination: protectedProcedure
    .input(setDocumentDestinationSchema)
    .mutation(async ({ input, ctx }) => {
      const { organizationId } = await requireKnowledgeAdmin(
        input.orgSlug,
        ctx.session.user.id,
      );
      return withRateLimit(
        { db, identifier: ctx.session.user.id, ...WRITE_LIMIT },
        () => setDocumentDestination(organizationId, input.parentPageId),
      );
    }),
};
