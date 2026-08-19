import type { SkillFrontmatter } from "./types";

export function parseFrontmatter(content: string): SkillFrontmatter {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match?.[1]) {
    throw new Error("No frontmatter found");
  }

  const block = match[1];

  const name = block.match(/^name:[^\S\r\n]*(.+)$/m)?.[1]?.trim();
  const description = block.match(/^description:[^\S\r\n]*(.+)$/m)?.[1]?.trim();

  if (!name || !description) {
    throw new Error("Frontmatter must include name and description");
  }

  return { name, description };
}

export function stripFrontmatter(content: string): string {
  const match = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  return match ? content.slice(match[0].length).trim() : content.trim();
}
