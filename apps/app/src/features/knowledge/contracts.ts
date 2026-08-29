// Kept dependency-free: the client bundle imports this.
import { type RouterOutputs } from "@/shared/api/trpc/contracts";

export const TOPIC_LANGUAGES = ["en", "de"] as const;

export type TopicLanguage = (typeof TOPIC_LANGUAGES)[number];

// Ceilings, not product limits: a topic scoped this widely is a mistake, and the
// launch decision put no cap on topics themselves. Globs are counted per
// repository, since that is where they apply.
export const MAX_TOPIC_REPOSITORIES = 50;
export const MAX_TOPIC_PATH_GLOBS = 20;

// One rule, stated once: the form refuses a bad glob where it is typed, and the
// server refuses the same one for anything that never went through the form.
// A glob narrows a path inside a repository, so anything reaching outside one —
// absolute, a parent traversal, a Windows separator — is a mistake, not a scope.
export const isValidPathGlob = (glob: string) =>
  glob.length > 0 &&
  glob.length <= 200 &&
  !glob.startsWith("/") &&
  !glob.includes("..") &&
  !glob.includes("\\");

// What a topic watches, resolved from the installation at write time. The globs
// narrow that one repository; empty means all of it.
export type TopicRepository = {
  id: string;
  fullName: string;
  pathGlobs: string[];
};

export type KnowledgeTopicsView = RouterOutputs["knowledge"]["list"];

export type KnowledgeTopic = KnowledgeTopicsView["topics"][number];

export type { KnowledgeTranslations } from "./i18n/knowledge.types";
