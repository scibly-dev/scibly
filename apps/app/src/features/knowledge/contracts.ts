// The client bundle imports this, so the enum comes from the schema-only entry point.
import type { KnowledgeTopicLanguage } from "@scibly/db/enums";

import { type RouterOutputs } from "@/shared/api/trpc/contracts";

export const TOPIC_LANGUAGES = [
  "en",
  "de",
] as const satisfies readonly KnowledgeTopicLanguage[];

export type TopicLanguage = (typeof TOPIC_LANGUAGES)[number];

export const MAX_TOPIC_REPOSITORIES = 50;
export const MAX_TOPIC_PATH_GLOBS = 20;

// Braces and long wildcard chains are refused because `matchesGlob` backtracks,
// and topic globs run against every file path of every bundle on a polled path.
export const isValidPathGlob = (glob: string) =>
  glob.length > 0 &&
  glob.length <= 200 &&
  !glob.startsWith("/") &&
  !glob.includes("..") &&
  !glob.includes("\\") &&
  !/[{}[\]?]/.test(glob) &&
  (glob.match(/\*/g)?.length ?? 0) <= 6;

export type { TopicRepositoryInput } from "./api/knowledge.schema";
export type { TopicRepository } from "./server/topic-repositories";

export type KnowledgeTopicsView = RouterOutputs["knowledge"]["list"];

export type KnowledgeTopic = KnowledgeTopicsView["topics"][number];

export type { KnowledgeTranslations } from "./i18n/knowledge.types";
