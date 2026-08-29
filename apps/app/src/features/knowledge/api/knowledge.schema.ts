import type { TopicRepository } from "../contracts";

import { orgSlugInput } from "@scibly/schemas/organization";
import { z } from "zod";

import {
  isValidPathGlob,
  MAX_TOPIC_PATH_GLOBS,
  MAX_TOPIC_REPOSITORIES,
  TOPIC_LANGUAGES,
} from "../contracts";

export { orgSlugInput };

export const pathGlobInput = z
  .string()
  .trim()
  .refine(
    isValidPathGlob,
    "A path glob must be repository-relative and may not contain '..' or '\\'.",
  );

const topicFields = {
  name: z.string().trim().min(1).max(120),
  // Ids, not names: the client may not decide what a repository is called, and
  // the server has to check the installation still reaches it either way. The
  // globs ride along per repository, because that is the scope they narrow.
  repositories: z
    .array(
      z.object({
        id: z.string().min(1),
        pathGlobs: z.array(pathGlobInput).max(MAX_TOPIC_PATH_GLOBS).default([]),
      }),
    )
    .min(1)
    .max(MAX_TOPIC_REPOSITORIES),
  maintainerMemberIds: z.array(z.string().min(1)).max(100).default([]),
  language: z.enum(TOPIC_LANGUAGES),
};

export const createTopicSchema = orgSlugInput.extend(topicFields);

export const updateTopicSchema = orgSlugInput.extend({
  topicId: z.string().min(1),
  ...topicFields,
});

export const listFoldersSchema = orgSlugInput.extend({
  repositoryId: z.string().min(1),
});

export const deleteTopicSchema = orgSlugInput.extend({
  topicId: z.string().min(1),
});

// One shape for the `repositories` Json column, checked on both sides of the
// database. The return annotations double as a drift guard: if this schema and
// the `TopicRepository` contract ever disagree, the typecheck fails here.
// Globs are not re-validated here: the request schema above already refuses a
// bad one, and refusing to read a row over one would hide the whole scope.
const storedRepository = z.object({
  id: z.string().min(1),
  fullName: z.string().min(1),
  pathGlobs: z.array(z.string()).default([]),
});

// Read resiliently: garbage in the column yields an empty scope, not a page
// that cannot render.
export const parseStoredRepositories = (value: unknown): TopicRepository[] =>
  z.array(storedRepository).catch([]).parse(value);

// Written strictly: a malformed scope refuses the save instead of persisting.
export const toStoredRepositories = (
  repositories: TopicRepository[],
): TopicRepository[] => z.array(storedRepository).parse(repositories);
