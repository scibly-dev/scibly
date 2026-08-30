import { AppError } from "@scibly/api/application-error";
import { Prisma } from "@scibly/db";
import { routes } from "@scibly/routes";

import { parseStoredRepositories } from "./topic-repositories";

export const TOPIC_SELECT = {
  id: true,
  name: true,
  repositories: true,
  language: true,
  notionPageId: true,
  externallyEditedAt: true,
  createdAt: true,
  updatedAt: true,
  maintainers: {
    select: { id: true, user: { select: { name: true, email: true } } },
  },
} as const;

type StoredTopic = Prisma.KnowledgeTopicGetPayload<{
  select: typeof TOPIC_SELECT;
}>;

export const toTopicView = <T extends StoredTopic>({
  repositories,
  maintainers,
  notionPageId,
  ...topic
}: T) => ({
  ...topic,
  documentUrl: notionPageId
    ? routes.external.integrations.notion.page(notionPageId)
    : null,
  repositories: parseStoredRepositories(repositories),
  maintainers: maintainers.map(({ id, user }) => ({
    memberId: id,
    name: user.name,
    email: user.email,
  })),
  pendingSuggestions: 0,
});

export const topicNotFound = () =>
  new AppError({
    code: "NOT_FOUND",
    applicationCode: "api.not_found",
    message: "No such knowledge topic in this organization.",
  });

export async function writeTopic<T>(write: () => Promise<T>): Promise<T> {
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
