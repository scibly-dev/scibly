import type { SkillMetadata, SkillSandbox } from "./types";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildSkillTools } from "./tools";

// The sandbox double throws for any path it wasn't given, so a containment
// check that leaks shows up as a read of a path this test never authorised.

const ROOT = "/app/notebook-skills";
const VISUALS = `${ROOT}/educational-visuals`;
const LESSONS = `${ROOT}/lesson-design`;

const SKILLS: SkillMetadata[] = [
  {
    name: "educational-visuals",
    description: "Diagrams that teach.",
    path: VISUALS,
  },
  {
    name: "lesson-design",
    description: "Macro-level instructional design.",
    path: LESSONS,
  },
];

const VISUALS_SKILL_MD = `---
name: educational-visuals
description: Diagrams that teach.
---

# Educational Visuals

See [examples.md](examples.md) for prompt patterns.
`;

const EXAMPLES_MD = `# Prompt patterns

A worked example.
`;

const files = new Map<string, string>(
  Object.entries({
    [`${VISUALS}/SKILL.md`]: VISUALS_SKILL_MD,
    [`${VISUALS}/examples.md`]: EXAMPLES_MD,
    [`${VISUALS}/assets/diagram.md`]: "# A nested asset\n",
    [`${LESSONS}/SKILL.md`]: `---\nname: lesson-design\ndescription: Macro-level instructional design.\n---\n\n# Lesson Design\n`,
    ["/app/.env"]: "SECRET=hunter2\n",
  }),
);

const linkedAway = `${VISUALS}/escape.md`;

const readFile = vi.fn();
const realpath = vi.fn();

const sandbox: SkillSandbox = {
  readFile: (file, encoding) => readFile(file, encoding),
  readdir: async () => {
    throw new Error("loadSkill has no business listing directories");
  },
  realpath: (file) => realpath(file),
};

function isDirectory(candidate: string) {
  return [...files.keys()].some((file) => file.startsWith(`${candidate}/`));
}

async function load(input: { name: string; file?: string }) {
  const { loadSkill } = buildSkillTools(SKILLS, sandbox);
  const execute = loadSkill.execute;
  if (!execute) throw new Error("loadSkill has no server executor");
  const result = await execute(input, {
    toolCallId: "call-1",
    messages: [],
    context: {},
  });
  if (Symbol.asyncIterator in result) {
    throw new Error("loadSkill returns one file, not a stream.");
  }
  return result;
}

function readPaths() {
  return readFile.mock.calls.map(([file]) => file as string);
}

beforeEach(() => {
  vi.resetAllMocks();

  readFile.mockImplementation(async (file: string) => {
    const content = files.get(file);
    if (content === undefined) throw new Error(`ENOENT: ${file}`);
    return content;
  });
  realpath.mockImplementation(async (file: string) => {
    if (file === linkedAway) return "/app/.env";
    if (files.has(file) || isDirectory(file)) return file;
    throw new Error(`ENOENT: ${file}`);
  });
});

describe("HL1 loading a skill returns its instructions, without the metadata", () => {
  it("HL1 returns the SKILL.md body with its frontmatter stripped", async () => {
    const result = await load({ name: "educational-visuals" });

    expect(result).toEqual({
      content:
        "# Educational Visuals\n\nSee [examples.md](examples.md) for prompt patterns.",
    });
  });

  it("HL1 strips it just the same when SKILL.md is named explicitly", async () => {
    const result = await load({
      name: "educational-visuals",
      file: "SKILL.md",
    });

    expect(result).toEqual(await load({ name: "educational-visuals" }));
  });

  it("HL1 resolves the handle regardless of case", async () => {
    const result = await load({ name: "Educational-Visuals" });

    expect(result).toHaveProperty("content");
    expect(readPaths()).toEqual([`${VISUALS}/SKILL.md`]);
  });
});

describe("HL2 an unknown skill is refused, and told what exists", () => {
  it("HL2 names the available skills", async () => {
    const result = await load({ name: "lesson-planning" });

    expect(result).toEqual({
      error:
        "Skill 'lesson-planning' not found. Available skills: educational-visuals, lesson-design",
    });
  });

  it("HL2 reads nothing", async () => {
    await load({ name: "lesson-planning" });

    expect(readFile).not.toHaveBeenCalled();
  });
});

describe("HL3 a supporting file comes back whole", () => {
  it("HL3 returns a file the skill's own instructions link to", async () => {
    const result = await load({
      name: "educational-visuals",
      file: "examples.md",
    });

    expect(result).toEqual({ content: EXAMPLES_MD });
  });

  it("HL3 does not strip a leading block from a supporting file", async () => {
    const withRule = `---\n\nA horizontal rule, not frontmatter.\n`;
    files.set(`${VISUALS}/notes.md`, withRule);

    const result = await load({
      name: "educational-visuals",
      file: "notes.md",
    });

    expect(result).toEqual({ content: withRule });
    files.delete(`${VISUALS}/notes.md`);
  });

  it("HL3 reaches a file in a folder inside the skill", async () => {
    const result = await load({
      name: "educational-visuals",
      file: "assets/diagram.md",
    });

    expect(result).toEqual({ content: "# A nested asset\n" });
  });
});

describe("HL4 nothing outside the skill's own folder is readable", () => {
  const escapes = [
    ["a relative climb", "../lesson-design/SKILL.md"],
    ["a climb past the root", "../../.env"],
    ["an absolute path", "/app/.env"],
    ["the parent itself", ".."],
    ["a climb that returns", "../educational-visuals/../../.env"],
    ["a symlink pointing away", "escape.md"],
  ] as const;

  it.each(escapes)("HL4 refuses %s", async (_case, file) => {
    const result = await load({ name: "educational-visuals", file });

    expect(result).toMatchObject({
      error: expect.stringContaining("outside"),
    });
  });

  it.each(escapes)("HL4 reads nothing for %s", async (_case, file) => {
    await load({ name: "educational-visuals", file });

    expect(readFile).not.toHaveBeenCalled();
  });

  it("HL4 refuses the skill's own folder as a file", async () => {
    const result = await load({ name: "educational-visuals", file: "." });

    expect(result).toMatchObject({ error: expect.any(String) });
  });
});

describe("HL5 a refusal is something the model can act on", () => {
  it("HL5 returns an error result when the file vanishes after it resolved", async () => {
    readFile.mockRejectedValue(new Error("EACCES"));

    const result = await load({ name: "educational-visuals" });

    expect(result).toMatchObject({
      error: expect.stringContaining("SKILL.md"),
    });
  });

  it("HL5 never throws, whatever it was asked for", async () => {
    const attempts = [
      { name: "nope" },
      { name: "educational-visuals", file: "../../.env" },
      { name: "educational-visuals", file: "missing.md" },
    ];

    for (const attempt of attempts) {
      await expect(load(attempt)).resolves.toHaveProperty("error");
    }
  });
});

describe("HL6 a missing file is refused by name", () => {
  it("HL6 names the file that is not there", async () => {
    const result = await load({
      name: "educational-visuals",
      file: "missing.md",
    });

    expect(result).toMatchObject({
      error: expect.stringContaining("missing.md"),
    });
  });

  it("HL6 does not fall back to the skill's SKILL.md", async () => {
    const result = await load({
      name: "educational-visuals",
      file: "missing.md",
    });

    expect(result).not.toHaveProperty("content");
    expect(readPaths()).not.toContain(`${VISUALS}/SKILL.md`);
  });
});

describe("HL7 the skill name never becomes a path", () => {
  const hostile = [
    ["a traversal", "../../.env"],
    ["a path separator", "educational-visuals/examples.md"],
    ["an absolute path", "/app/.env"],
  ] as const;

  it.each(hostile)("HL7 treats %s as an unknown skill", async (_case, name) => {
    const result = await load({ name });

    expect(result).toMatchObject({
      error: expect.stringContaining("not found"),
    });
  });

  it.each(hostile)("HL7 touches no filesystem for %s", async (_case, name) => {
    await load({ name });

    expect(readFile).not.toHaveBeenCalled();
    expect(realpath).not.toHaveBeenCalled();
  });
});
