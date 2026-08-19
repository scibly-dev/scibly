import type { SkillMetadata, SkillSandbox } from "./types";

import path from "node:path";

import { tool } from "ai";
import { z } from "zod";

import { SKILL_ENTRY_FILE } from "./constants";
import { stripFrontmatter } from "./frontmatter";
import { nodeSandbox } from "./sandbox";

type Resolution =
  | { ok: true; absolutePath: string; isEntryFile: boolean }
  | { ok: false; reason: "outside" | "missing" };

// Model-supplied `file` is checked both lexically (rejects `../`, absolute
// paths) and against the real path (rejects symlinks escaping the skill dir).
async function resolveSkillFile(
  sandbox: SkillSandbox,
  skill: SkillMetadata,
  file: string,
): Promise<Resolution> {
  const root = path.resolve(skill.path);
  const requested = path.resolve(root, file);

  if (requested !== root && !requested.startsWith(root + path.sep)) {
    return { ok: false, reason: "outside" };
  }

  let realRoot: string;
  let realTarget: string;
  try {
    realRoot = await sandbox.realpath(root);
    realTarget = await sandbox.realpath(requested);
  } catch {
    return { ok: false, reason: "missing" };
  }

  if (realTarget !== realRoot && !realTarget.startsWith(realRoot + path.sep)) {
    return { ok: false, reason: "outside" };
  }

  return {
    ok: true,
    absolutePath: requested,
    isEntryFile: path.relative(root, requested) === SKILL_ENTRY_FILE,
  };
}

export function buildSkillTools(
  skills: SkillMetadata[],
  sandbox: SkillSandbox = nodeSandbox,
) {
  const available = skills.map((s) => s.name).join(", ");

  return {
    loadSkill: tool({
      description:
        "Load a skill to get specialized instructions for lesson design or scene content authoring. Scene content covers scene HTML, source grounding, and outdated scene refresh workflows.",
      inputSchema: z.object({
        name: z
          .string()
          .describe(`Skill name to load. Available skills: ${available}`),
        file: z
          .string()
          .optional()
          .describe(
            `A supporting file within that skill's own folder, as linked from its instructions (e.g. examples.md). Defaults to ${SKILL_ENTRY_FILE}.`,
          ),
      }),

      execute: async ({ name, file }) => {
        const skill = skills.find(
          (s) => s.name.toLowerCase() === name.toLowerCase(),
        );
        if (!skill) {
          return {
            error: `Skill '${name}' not found. Available skills: ${available}`,
          };
        }

        const requestedFile = file ?? SKILL_ENTRY_FILE;
        const resolved = await resolveSkillFile(sandbox, skill, requestedFile);

        if (!resolved.ok) {
          return resolved.reason === "outside"
            ? {
                error: `'${requestedFile}' is outside the '${skill.name}' skill. Only files within a skill's own folder can be loaded.`,
              }
            : {
                error: `'${requestedFile}' does not exist in the '${skill.name}' skill.`,
              };
        }

        let content: string;
        try {
          content = await sandbox.readFile(resolved.absolutePath, "utf-8");
        } catch {
          return {
            error: `'${requestedFile}' in the '${skill.name}' skill could not be read.`,
          };
        }

        return {
          content: resolved.isEntryFile ? stripFrontmatter(content) : content,
        };
      },
    }),
  };
}
