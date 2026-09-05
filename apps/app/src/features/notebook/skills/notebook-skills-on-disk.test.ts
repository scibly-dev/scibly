import { describe, expect, it } from "vitest";

import { getNotebookSkills } from "./catalogue";

// Vitest's cwd is apps/app, so agentFilesRoot() resolves to the folder we deploy.
describe("the skills the app ships", () => {
  it("discovers every skill folder, and nothing beside them", async () => {
    const names = (await getNotebookSkills()).map((skill) => skill.name).sort();

    expect(names).toEqual([
      "batch-flow",
      "discovery",
      "educational-visuals",
      "lesson-design",
      "practice-scenes",
      "review-check",
      "scene-content",
    ]);
  });
});
