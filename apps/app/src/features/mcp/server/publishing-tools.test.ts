// @vitest-environment node
import type { McpServer } from "@modelcontextprotocol/server";

import { CLIENT_CAPABILITIES_META_KEY } from "@modelcontextprotocol/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const publishCourse = vi.fn(async () => ({ success: true, version: 3 }));
const updateCourse = vi.fn(async () => ({ id: "course-live" }));

const COURSES = vi.hoisted(() => ({
  "course-live": {
    title: "Photosynthesis",
    allowAnonymous: true,
    versions: [{ version: 2 }],
  },
  "course-draft": {
    title: "Cell division",
    allowAnonymous: true,
    versions: [],
  },
  "course-private": {
    title: "Onboarding",
    allowAnonymous: false,
    versions: [{ version: 1 }],
  },
  "course-neither": {
    title: "Half-written",
    allowAnonymous: false,
    versions: [],
  },
}));

vi.mock("@/features/course-authoring/server", () => ({
  publishCourse,
  updateCourse,
  getCourse: async (_userId: string, courseId: string) =>
    COURSES[courseId as keyof typeof COURSES],
}));

const { registerPublishingTools } = await import("./publishing-tools");

type ToolResult = { content: { text: string }[] };
type Tool = (args: never, ctx: never) => Promise<ToolResult>;

const ENVELOPE = { [CLIENT_CAPABILITIES_META_KEY]: { elicitation: {} } };

const UNANSWERED = {
  mcpReq: {
    envelope: ENVELOPE,
    inputResponses: undefined,
    requestState: () => undefined,
  },
};

const UNASKABLE = {
  mcpReq: { inputResponses: undefined, requestState: () => undefined },
};

function answered(state: string, confirm = true) {
  return {
    mcpReq: {
      envelope: ENVELOPE,
      inputResponses: {
        confirm: {
          type: "elicit",
          action: "accept",
          content: { confirm },
        },
      },
      requestState: () => state,
    },
  };
}

type ToolOutput = {
  success?: boolean;
  message?: string;
  version?: number;
  publicUrl?: string;
  html?: string;
  isPublic?: boolean;
  requestState?: string;
};

type ToolArgs = {
  courseId: string;
  supersedePrevious?: boolean;
  heightPx?: number;
  isPublic?: boolean;
};

const tools = new Map<string, Tool>();
const annotations = new Map<string, Record<string, boolean> | undefined>();

registerPublishingTools(
  {
    registerTool: (
      name: string,
      config: { annotations?: Record<string, boolean> },
      callback: Tool,
    ) => {
      tools.set(name, callback);
      annotations.set(name, config.annotations);
    },
  } as unknown as McpServer,
  "user-1",
);

async function call(name: string, args: ToolArgs, ctx: unknown = UNANSWERED) {
  const tool = tools.get(name);
  if (!tool) throw new Error(`${name} was never registered`);
  const result = await tool(args as never, ctx as never);
  return (
    result.content ? JSON.parse(result.content[0]!.text) : result
  ) as ToolOutput;
}

beforeEach(() => {
  publishCourse.mockClear();
  updateCourse.mockClear();
});

describe("publishCourse", () => {
  it("PUB1: publishes without moving enrolled learners unless asked", async () => {
    await call("publishCourse", { courseId: "course-live" });

    expect(publishCourse).toHaveBeenCalledWith("user-1", {
      courseId: "course-live",
      supersedePrevious: false,
    });
  });

  it("PUB1: passes the supersede request through when the author asked for it", async () => {
    const result = await call("publishCourse", {
      courseId: "course-live",
      supersedePrevious: true,
    });

    expect(publishCourse).toHaveBeenCalledWith("user-1", {
      courseId: "course-live",
      supersedePrevious: true,
    });
    expect(result.version).toBe(3);
  });
});

describe("getCourseEmbed", () => {
  it("PUB2: hands back a snippet pointing at the course, sized as asked", async () => {
    const result = await call("getCourseEmbed", {
      courseId: "course-live",
      heightPx: 720,
    });

    expect(result.success).toBe(true);
    expect(result.version).toBe(2);
    expect(result.html).toContain("/embed/courses/course-live");
    expect(result.html).toContain('height="720"');
    expect(result.html).toContain("<script");
    expect(result.publicUrl).toContain("/public/courses/course-live");
  });

  it("PUB2: titles the frame, escaped, since the title is the author's text", async () => {
    const result = await call("getCourseEmbed", { courseId: "course-live" });

    expect(result.html).toContain('title="Photosynthesis"');
  });

  it("PUB3: refuses a course that has never been published", async () => {
    const result = await call("getCourseEmbed", { courseId: "course-draft" });

    expect(result.success).toBe(false);
    expect(result.html).toBeUndefined();
    expect(result.message).toContain("publishCourse");
  });

  it("PUB3: refuses a published course that is not publicly accessible", async () => {
    const result = await call("getCourseEmbed", { courseId: "course-private" });

    expect(result.success).toBe(false);
    expect(result.html).toBeUndefined();
    expect(result.message).toContain("public access is off");
  });

  it("PUB3: names both blockers at once, so the author is not sent round twice", async () => {
    const result = await call("getCourseEmbed", { courseId: "course-neither" });

    expect(result.message).toContain("never been published");
    expect(result.message).toContain("public access is off");
  });

  it("PUB4: is annotated read-only, so a client knows it changes nothing", () => {
    expect(annotations.get("getCourseEmbed")?.readOnlyHint).toBe(true);
    expect(annotations.get("publishCourse")?.readOnlyHint).toBeUndefined();
  });
});

describe("setCoursePublic", () => {
  it("PUB5: asks the author before opening a course to the internet", async () => {
    const result = await call("setCoursePublic", {
      courseId: "course-private",
      isPublic: true,
    });

    expect(updateCourse).not.toHaveBeenCalled();
    expect(result.requestState).toBe(
      JSON.stringify(["setCoursePublic", "course-private", ["true"]]),
    );
  });

  it("PUB5: flips it once the author has approved", async () => {
    const state = JSON.stringify([
      "setCoursePublic",
      "course-private",
      ["true"],
    ]);
    const result = await call(
      "setCoursePublic",
      { courseId: "course-private", isPublic: true },
      answered(state),
    );

    expect(updateCourse).toHaveBeenCalledWith("user-1", {
      courseId: "course-private",
      allowAnonymous: true,
    });
    expect(result.success).toBe(true);
  });

  it("PUB5: an approval to open one course cannot open another", async () => {
    const elsewhere = JSON.stringify([
      "setCoursePublic",
      "course-neither",
      ["true"],
    ]);
    const result = await call(
      "setCoursePublic",
      { courseId: "course-private", isPublic: true },
      answered(elsewhere),
    );

    expect(updateCourse).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.message).toContain("nothing changed");
  });

  it("PUB5: an unticked box is a no", async () => {
    const state = JSON.stringify([
      "setCoursePublic",
      "course-private",
      ["true"],
    ]);
    const result = await call(
      "setCoursePublic",
      { courseId: "course-private", isPublic: true },
      answered(state, false),
    );

    expect(updateCourse).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
  });

  it("PUB5: answers a client it cannot ask, rather than opening the course anyway (ADR 0006)", async () => {
    const result = await call(
      "setCoursePublic",
      { courseId: "course-private", isPublic: true },
      UNASKABLE,
    );

    expect(updateCourse).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.message).toContain("cannot be asked");
  });

  it("PUB6: does not ask about a course that is already public", async () => {
    const result = await call("setCoursePublic", {
      courseId: "course-live",
      isPublic: true,
    });

    expect(updateCourse).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.message).toContain("already public");
  });
});
