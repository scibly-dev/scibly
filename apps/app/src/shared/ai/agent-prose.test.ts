import { describe, expect, it } from "vitest";

import { readAgentProse } from "./agent-prose";

describe("the prose the agent reads lives in notebook-skills/", () => {
  it("serves the system prompt, the always-on rules and the practice contract", async () => {
    expect(await readAgentProse("system-prompt.md")).toContain(
      "Scibly's AI Learning Designer",
    );
    expect(await readAgentProse("authoring-rules.md")).toContain(
      "Non-negotiable authoring rules",
    );
    expect(await readAgentProse("practice-contract.md")).toContain(
      "window.scibly.submit(work)",
    );
  });

  it("hands back prose with no frontmatter to strip", async () => {
    for (const file of [
      "system-prompt.md",
      "authoring-rules.md",
      "practice-contract.md",
    ] as const) {
      expect(await readAgentProse(file)).not.toMatch(/^---\r?\n/);
    }
  });
});
