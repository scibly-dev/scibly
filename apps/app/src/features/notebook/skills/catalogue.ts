import type { SkillMetadata } from "./types";

import path from "node:path";

import "server-only";

import { discoverSkills } from "./discover";
import { nodeSandbox } from "./sandbox";

let cachedSkills: SkillMetadata[] | null = null;

export async function getNotebookSkills(): Promise<SkillMetadata[]> {
  if (process.env.NODE_ENV === "production" && cachedSkills) {
    return cachedSkills;
  }

  const root = path.join(process.cwd(), "notebook-skills");
  const skills = await discoverSkills(nodeSandbox, [root]);

  if (process.env.NODE_ENV === "production") {
    cachedSkills = skills;
  }

  return skills;
}

export function clearNotebookSkillsCache(): void {
  cachedSkills = null;
}
