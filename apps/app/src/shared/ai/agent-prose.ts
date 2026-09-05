import fs from "node:fs/promises";
import path from "node:path";

import "server-only";

export function agentFilesRoot(): string {
  return path.join(process.cwd(), "notebook-skills");
}

export type AgentProseFile =
  | "system-prompt.md"
  | "authoring-rules.md"
  | "practice-contract.md";

export async function readAgentProse(file: AgentProseFile): Promise<string> {
  const content = await fs.readFile(path.join(agentFilesRoot(), file), "utf-8");
  return content.trim();
}
