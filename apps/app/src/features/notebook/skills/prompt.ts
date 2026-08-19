import type { SkillMetadata } from "./types";

export function buildSkillsPrompt(skills: SkillMetadata[]): string {
  if (skills.length === 0) return "";

  const skillsList = skills
    .map((s) => `- ${s.name}: ${s.description}`)
    .join("\n");

  return `## Available skills

Load with \`loadSkill\` before applying detailed guidance:

${skillsList}`.trim();
}
