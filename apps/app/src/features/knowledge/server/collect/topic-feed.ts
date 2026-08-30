import type { TopicRepository } from "../topic-repositories";

import { db } from "@scibly/db";
import { matchesGlob } from "path";

/** A window, not pages: everything older lives in the topic document. */
const FEED_WINDOW = { runs: 20, bundles: 50 } as const;

// Empty globs means the topic watches the whole repository.
const touchesScope = (filePaths: string[], pathGlobs: string[]) =>
  pathGlobs.length === 0 ||
  filePaths.some((filePath) =>
    pathGlobs.some((glob) => matchesGlob(filePath, glob)),
  );

// A scope is per topic and a bundle is per repository, so path filtering
// happens in JS after the windowed query.
export async function loadTopicFeed(
  organizationId: string,
  repositories: TopicRepository[],
) {
  if (repositories.length === 0) return { runs: [], bundles: [] };
  const repositoryIds = repositories.map((repository) => repository.id);
  const nameById = new Map(
    repositories.map((repository) => [repository.id, repository.fullName]),
  );
  const globsById = new Map(
    repositories.map((repository) => [repository.id, repository.pathGlobs]),
  );

  const [runs, stored] = await Promise.all([
    db.knowledgeCollectionRun.findMany({
      where: { organizationId, repositoryId: { in: repositoryIds } },
      orderBy: { startedAt: "desc" },
      take: FEED_WINDOW.runs,
      select: {
        id: true,
        repositoryId: true,
        status: true,
        startedAt: true,
        collected: true,
        discarded: true,
        capped: true,
        failureReason: true,
      },
    }),
    db.knowledgeBundle.findMany({
      where: {
        organizationId,
        repositoryId: { in: repositoryIds },
        discardReason: null,
      },
      orderBy: { collectedAt: "desc" },
      take: FEED_WINDOW.bundles,
      // Never select `content`: the feed is polled.
      select: {
        id: true,
        repositoryId: true,
        number: true,
        title: true,
        url: true,
        filePaths: true,
        truncated: true,
      },
    }),
  ]);

  const bundles = stored.flatMap((bundle) => {
    if (bundle.title === null || bundle.url === null) return [];
    const globs = globsById.get(bundle.repositoryId) ?? [];
    if (!touchesScope(bundle.filePaths, globs)) return [];
    return [
      {
        id: bundle.id,
        number: bundle.number,
        title: bundle.title,
        url: bundle.url,
        repository: nameById.get(bundle.repositoryId) ?? bundle.repositoryId,
        truncated: bundle.truncated,
      },
    ];
  });

  return {
    runs: runs.map(({ repositoryId, ...run }) => ({
      ...run,
      repository: nameById.get(repositoryId) ?? repositoryId,
    })),
    bundles,
  };
}
