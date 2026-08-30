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

export const setDocumentDestinationSchema = orgSlugInput.extend({
  parentPageId: z.string().min(1),
});
