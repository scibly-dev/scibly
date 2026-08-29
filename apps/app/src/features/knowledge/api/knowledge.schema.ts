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

export type TopicRepositoryInput = z.infer<
  typeof createTopicSchema
>["repositories"][number];

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

const storedRepository = z.object({
  id: z.string().min(1),
  fullName: z.string().min(1),
  pathGlobs: z.array(z.string()).default([]),
});

export const parseStoredRepositories = (value: unknown): TopicRepository[] =>
  z
    .array(storedRepository.nullable().catch(null))
    .catch([])
    .parse(value)
    .filter((repository) => repository !== null);

export const toStoredRepositories = (
  repositories: TopicRepository[],
): TopicRepository[] => z.array(storedRepository).parse(repositories);
