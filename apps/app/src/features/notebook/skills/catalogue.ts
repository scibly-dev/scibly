import type { SkillMetadata } from "./types";

import "server-only";
import { env } from "@/env";
import { agentFilesRoot } from "@/shared/ai/agent-prose";

import { discoverSkills } from "./discover";
import { nodeSandbox } from "./sandbox";

// discoverSkills swallows every filesystem error it meets, so this can never cache a rejection.
let cachedSkills: Promise<SkillMetadata[]> | null = null;

export function getNotebookSkills(): Promise<SkillMetadata[]> {
  const walk = () => discoverSkills(nodeSandbox, [agentFilesRoot()]);

  if (env.NODE_ENV !== "production") return walk();

  return (cachedSkills ??= walk());
}

export function clearNotebookSkillsCache(): void {
  cachedSkills = null;
}
