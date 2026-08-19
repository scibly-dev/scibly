import type { SkillMetadata, SkillSandbox } from "./types";

import path from "node:path";

import { SKILL_ENTRY_FILE } from "./constants";
import { parseFrontmatter } from "./frontmatter";

export async function discoverSkills(
  sandbox: SkillSandbox,
  directories: string[],
): Promise<SkillMetadata[]> {
  const skills: SkillMetadata[] = [];
  const seenNames = new Set<string>();

  for (const dir of directories) {
    let entries;
    try {
      entries = await sandbox.readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const skillDir = path.join(dir, entry.name);
      const skillFile = path.join(skillDir, SKILL_ENTRY_FILE);

      let content: string;
      try {
        content = await sandbox.readFile(skillFile, "utf-8");
      } catch {
        continue;
      }

      let frontmatter;
      try {
        frontmatter = parseFrontmatter(content);
      } catch (error) {
        console.warn(
          `[Skills] Ignoring ${skillDir}: ${error instanceof Error ? error.message : String(error)}`,
        );
        continue;
      }

      const handle = frontmatter.name.toLowerCase();
      if (seenNames.has(handle)) {
        console.warn(
          `[Skills] Ignoring ${skillDir}: the name '${frontmatter.name}' is already taken by an earlier skill.`,
        );
        continue;
      }
      seenNames.add(handle);

      skills.push({
        name: frontmatter.name,
        description: frontmatter.description,
        path: skillDir,
      });
    }
  }

  return skills;
}
