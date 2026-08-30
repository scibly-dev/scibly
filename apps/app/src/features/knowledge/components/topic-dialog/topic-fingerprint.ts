import type { TopicLanguage } from "../../contracts";

// Order is not part of a scope, so re-picking the same things must not cost a write.
export function topicFingerprint({
  name,
  repositories,
  maintainerMemberIds,
  language,
}: {
  name: string;
  repositories: { id: string; pathGlobs: string[] }[];
  maintainerMemberIds: string[];
  language: TopicLanguage;
}): string {
  return JSON.stringify([
    name.trim(),
    [...repositories]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((repo) => [repo.id, [...repo.pathGlobs].sort()]),
    [...maintainerMemberIds].sort(),
    language,
  ]);
}
