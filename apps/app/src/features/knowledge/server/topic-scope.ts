import type { TopicRepository, TopicRepositoryInput } from "../contracts";

import { AppError } from "@scibly/api/application-error";
import { db } from "@scibly/db";

import { resolveRepositoryConnection } from "@/features/integrations/server";

export const badScope = (message: string) =>
  new AppError({
    code: "BAD_REQUEST",
    applicationCode: "knowledge.invalid_scope",
    message,
  });

const unreachableRepository = (id: string) =>
  badScope(
    `Repository ${id} is not one this organization's GitHub installation reaches.`,
  );

type RepositoryConnection = Awaited<
  ReturnType<typeof resolveRepositoryConnection>
>;

export async function requireReachableRepository(
  { provider, token }: RepositoryConnection,
  id: string,
): Promise<string> {
  const grant = await provider.resolveGrant(token, id);
  if (!grant) throw unreachableRepository(id);
  return grant.name;
}

async function resolveRepositories(
  organizationId: string,
  repositories: TopicRepositoryInput[],
) {
  const connection = await resolveRepositoryConnection(
    organizationId,
    "GITHUB",
  );
  const { grants, totalCount } = await connection.provider.listGrants(
    connection.token,
  );
  const nameById = new Map(grants.map((grant) => [grant.id, grant.name]));
  // Only a complete listing may call an id unreachable on its own: one that stopped at its page budget has not seen every repository.
  const listedEverything = grants.length >= totalCount;

  const unique = [
    ...new Map(repositories.map((repo) => [repo.id, repo])).values(),
  ];
  // Sequential, not `Promise.all`: a truncated listing can leave fifty ids to resolve, and GitHub answers that burst with a rate limit.
  const settled: TopicRepository[] = [];
  for (const { id, pathGlobs } of unique) {
    const listed = nameById.get(id);
    if (!listed && listedEverything) throw unreachableRepository(id);
    const fullName =
      listed ?? (await requireReachableRepository(connection, id));
    settled.push({ id, fullName, pathGlobs });
  }
  return settled;
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

export async function resolveTopicScope(
  organizationId: string,
  input: {
    repositories: TopicRepositoryInput[];
    maintainerMemberIds: string[];
  },
) {
  const [repositories, maintainers] = await Promise.all([
    resolveRepositories(organizationId, input.repositories),
    resolveMaintainers(organizationId, input.maintainerMemberIds),
  ]);
  return { repositories, maintainers };
}
