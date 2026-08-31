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
