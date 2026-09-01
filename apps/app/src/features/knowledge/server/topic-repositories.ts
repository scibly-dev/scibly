import { matchesGlob } from "path";
import { z } from "zod";

const storedRepository = z.object({
  id: z.string().min(1),
  fullName: z.string().min(1),
  pathGlobs: z.array(z.string()).default([]),
});

export type TopicRepository = z.infer<typeof storedRepository>;

export const parseStoredRepositories = (value: unknown): TopicRepository[] =>
  z
    .array(storedRepository.nullable().catch(null))
    .catch([])
    .parse(value)
    .filter((repository) => repository !== null);

/** Empty globs means the topic watches the whole repository. */
export const touchesScope = (filePaths: string[], pathGlobs: string[]) =>
  pathGlobs.length === 0 ||
  filePaths.some((filePath) =>
    pathGlobs.some((glob) => matchesGlob(filePath, glob)),
  );

/**
 * Everything in a glob before its first metacharacter — a loose filter the
 * database can apply. It may let through paths the glob rejects, never the
 * opposite, so the metacharacter set is deliberately wide.
 */
export const globPrefix = (glob: string): string => {
  const at = glob.search(/[*?[\]{}!+@()|]/);
  return at < 0 ? glob : glob.slice(0, at);
};
