import type { SkillMetadata, SkillSandbox } from "./types";

import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildSkillsPrompt } from "./prompt";

const ROOT = "/app/notebook-skills";

function skillFile(name: string, description: string, body = "# Body") {
  return `---\nname: ${name}\ndescription: ${description}\n---\n\n${body}\n`;
}

function sandboxFrom(files: Record<string, string>): SkillSandbox {
  return {
    readFile: async (file) => {
      const content = files[file];
      if (content === undefined) throw new Error(`ENOENT: ${file}`);
      return content;
    },
    readdir: async (dir) => {
      const contained = Object.keys(files).filter((file) =>
        file.startsWith(`${dir}/`),
      );
      if (contained.length === 0) throw new Error(`ENOENT: ${dir}`);

      const entries = new Map<string, boolean>();
      for (const file of contained) {
        const rest = file.slice(dir.length + 1);
        const separator = rest.indexOf("/");
        const name = separator === -1 ? rest : rest.slice(0, separator);
        entries.set(name, separator !== -1);
      }
      return [...entries].map(([name, directory]) => ({
        name,
        isDirectory: () => directory,
      }));
    },
    realpath: async (file) => file,
  };
}

const { discoverSkills } = await import("./discover");

async function discover(files: Record<string, string>) {
  return discoverSkills(sandboxFrom(files), [ROOT]);
}

let warn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("HD1 a folder with a SKILL.md is a skill, known by its frontmatter name", () => {
  it("HD1 reports each skill's name, description and folder", async () => {
    const skills = await discover({
      [`${ROOT}/lesson-design/SKILL.md`]: skillFile(
        "lesson-design",
        "Macro-level instructional design.",
      ),
      [`${ROOT}/scene-content/SKILL.md`]: skillFile(
        "scene-content",
        "Scene HTML and source grounding.",
      ),
    });

    expect(skills).toEqual([
      {
        name: "lesson-design",
        description: "Macro-level instructional design.",
        path: `${ROOT}/lesson-design`,
      },
      {
        name: "scene-content",
        description: "Scene HTML and source grounding.",
        path: `${ROOT}/scene-content`,
      },
    ]);
  });

  it("HD1 takes the handle from the frontmatter, not from the folder", async () => {
    const skills = await discover({
      [`${ROOT}/01-lesson-design/SKILL.md`]: skillFile(
        "lesson-design",
        "Macro-level instructional design.",
      ),
    });

    expect(skills[0]?.name).toBe("lesson-design");
    expect(skills[0]?.path).toBe(`${ROOT}/01-lesson-design`);
  });
});

describe("HD2 a folder without a SKILL.md is not a skill", () => {
  it("HD2 skips it and still finds the others", async () => {
    const skills = await discover({
      [`${ROOT}/notes/scratch.md`]: "half a thought",
      [`${ROOT}/discovery/SKILL.md`]: skillFile("discovery", "Ask first."),
    });

    expect(skills.map((skill) => skill.name)).toEqual(["discovery"]);
  });

  it("HD2 says nothing about it — a loose folder is ordinary", async () => {
    await discover({ [`${ROOT}/notes/scratch.md`]: "half a thought" });

    expect(warn).not.toHaveBeenCalled();
  });
});

describe("HD3 a malformed SKILL.md is skipped, and the skip is recorded", () => {
  const malformed = [
    ["no frontmatter at all", "# Just a heading\n"],
    ["no name", "---\ndescription: Only a description.\n---\n\n# Body\n"],
    ["no description", "---\nname: lonely\n---\n\n# Body\n"],
    ["an unterminated block", "---\nname: open\ndescription: Never closed.\n"],
    ["an empty name", "---\nname:\ndescription: Present.\n---\n\n# Body\n"],
  ] as const;

  it.each(malformed)("HD3 skips a SKILL.md with %s", async (_case, content) => {
    const skills = await discover({
      [`${ROOT}/broken/SKILL.md`]: content,
      [`${ROOT}/discovery/SKILL.md`]: skillFile("discovery", "Ask first."),
    });

    expect(skills.map((skill) => skill.name)).toEqual(["discovery"]);
  });

  it("HD3 names the folder it dropped, so a typo is diagnosable", async () => {
    await discover({ [`${ROOT}/broken/SKILL.md`]: "# No frontmatter\n" });

    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toContain(`${ROOT}/broken`);
  });
});

describe("HD4 a loose file at the skills root is not a skill", () => {
  it("HD4 ignores files beside the skill folders", async () => {
    const skills = await discover({
      [`${ROOT}/README.md`]: skillFile("readme", "Not a skill."),
      [`${ROOT}/discovery/SKILL.md`]: skillFile("discovery", "Ask first."),
    });

    expect(skills.map((skill) => skill.name)).toEqual(["discovery"]);
  });
});

describe("HD5 discovery looks one level deep", () => {
  it("HD5 does not treat a folder inside a skill as a second skill", async () => {
    const skills = await discover({
      [`${ROOT}/educational-visuals/SKILL.md`]: skillFile(
        "educational-visuals",
        "Diagrams that teach.",
      ),
      [`${ROOT}/educational-visuals/deep/SKILL.md`]: skillFile(
        "deep",
        "Should stay internal.",
      ),
    });

    expect(skills.map((skill) => skill.name)).toEqual(["educational-visuals"]);
  });
});

describe("HD6 a missing skills root is no skills, not an error", () => {
  it("HD6 returns an empty list", async () => {
    await expect(discover({})).resolves.toEqual([]);
  });
});

describe("HD7 one handle resolves to exactly one skill", () => {
  it("HD7 keeps the first and drops the second", async () => {
    const skills = await discover({
      [`${ROOT}/a-discovery/SKILL.md`]: skillFile("discovery", "The first."),
      [`${ROOT}/z-discovery/SKILL.md`]: skillFile("discovery", "The second."),
    });

    expect(skills).toHaveLength(1);
    expect(skills[0]?.description).toBe("The first.");
  });

  it("HD7 counts names the way loadSkill matches them, ignoring case", async () => {
    const skills = await discover({
      [`${ROOT}/a-discovery/SKILL.md`]: skillFile("discovery", "The first."),
      [`${ROOT}/z-discovery/SKILL.md`]: skillFile("Discovery", "The second."),
    });

    expect(skills).toHaveLength(1);
  });

  it("HD7 names the folder it dropped", async () => {
    await discover({
      [`${ROOT}/a-discovery/SKILL.md`]: skillFile("discovery", "The first."),
      [`${ROOT}/z-discovery/SKILL.md`]: skillFile("discovery", "The second."),
    });

    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toContain(`${ROOT}/z-discovery`);
  });
});

describe("HP the prompt is how the model chooses without loading", () => {
  const skills: SkillMetadata[] = [
    {
      name: "lesson-design",
      description: "Use whenever the user asks to design a course.",
      path: `${ROOT}/lesson-design`,
    },
    {
      name: "scene-content",
      description: "Scene HTML and source grounding.",
      path: `${ROOT}/scene-content`,
    },
  ];

  it("HP1 lists every skill by name and description", async () => {
    const prompt = buildSkillsPrompt(skills);

    for (const skill of skills) {
      expect(prompt).toContain(`${skill.name}: ${skill.description}`);
    }
  });

  it("HP2 says nothing when there is nothing to load", () => {
    expect(buildSkillsPrompt([])).toBe("");
  });
});

describe("HC what the process remembers", () => {
  const cwdRoot = path.join(process.cwd(), "notebook-skills");
  const files = {
    [`${cwdRoot}/discovery/SKILL.md`]: skillFile("discovery", "Ask first."),
  };

  async function loadSkillsTwice(nodeEnv: string) {
    vi.stubEnv("NODE_ENV", nodeEnv);
    const readdir = vi.fn(sandboxFrom(files).readdir);
    vi.doMock("./sandbox", () => ({
      nodeSandbox: { ...sandboxFrom(files), readdir },
    }));

    vi.resetModules();
    const skillsModule = await import("./index");
    skillsModule.clearNotebookSkillsCache();

    const first = await skillsModule.getNotebookSkills();
    const second = await skillsModule.getNotebookSkills();
    skillsModule.clearNotebookSkillsCache();

    return { first, second, walks: readdir.mock.calls.length };
  }

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.doUnmock("./sandbox");
    vi.resetModules();
  });

  it("HC1 walks the folder once per process in production", async () => {
    const { first, second, walks } = await loadSkillsTwice("production");

    expect(walks).toBe(1);
    expect(second).toBe(first);
    expect(first.map((skill) => skill.name)).toEqual(["discovery"]);
  });

  it("HC2 re-reads the folder outside production, so an edit lands next message", async () => {
    const { walks } = await loadSkillsTwice("development");

    expect(walks).toBe(2);
  });
});
