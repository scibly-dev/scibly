import type { Principal } from "@scibly/auth/session";
import type { TrpcCaller } from "@/server/api/root";

import { AppError } from "@scibly/api/application-error";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { handleMcpRequest, jsonRpcError, mcpUnauthorized } from "./handler";
import { MCP_TOOL_NAMES } from "./tool-surface";

// The content tools are the one pair the registry cannot supply, so their
// collaborators are doubled here: the scene content query, the collab room (its
// own test file boots a real server against it) and the scene access policy.
const getSceneContent = vi.hoisted(() => vi.fn());
const writeSceneHtml = vi.hoisted(() => vi.fn());
const requireDraftSceneContentAccess = vi.hoisted(() => vi.fn());

vi.mock(
  "@/features/course-authoring/scenes/editor/document-synchronization/server/scene-document",
  () => ({ writeSceneHtml }),
);

vi.mock(
  "@/features/course-authoring/scenes/server/scene-queries",
  async (importOriginal) => ({
    ...(await importOriginal<object>()),
    getSceneContent,
  }),
);

vi.mock(
  "@/features/course-authoring/scenes/server/scene-access",
  async (importOriginal) => ({
    ...(await importOriginal<object>()),
    requireDraftSceneContentAccess,
  }),
);

/** A draft scene the author may write to. */
function draftScene() {
  requireDraftSceneContentAccess.mockResolvedValue({
    lesson: { course: { organizationId: "org-1" } },
  });
}

const COURSES = { items: [{ id: "course-1", title: "Spotting phishing" }] };

/** The tools' own procedures are doubled, nothing between them is. */
function fakeCaller() {
  const list = vi.fn(async () => COURSES);
  const courses = new Map<string, { id: string; title: string }>(
    COURSES.items.map((course) => [course.id, { ...course }]),
  );
  const lessons: { id: string; courseId: string; title: string }[] = [];
  const scenes: { id: string; lessonId: string; title: string }[] = [];
  const next = (prefix: string, count: number) => `${prefix}-${count + 1}`;

  const create = vi.fn(async (input: { title: string }) => {
    const course = { id: next("course", courses.size), title: input.title };
    courses.set(course.id, course);
    return course;
  });
  const getById = vi.fn(async (input: { courseId: string }) =>
    courses.get(input.courseId),
  );
  const createLesson = vi.fn(
    async (input: { courseId: string; title: string }) => {
      const lesson = { id: next("lesson", lessons.length), ...input };
      lessons.push(lesson);
      return lesson;
    },
  );
  const updateLesson = vi.fn(
    async (input: { lessonId: string; title?: string }) => {
      const lesson = lessons.find((row) => row.id === input.lessonId);
      if (lesson && input.title) lesson.title = input.title;
      return lesson;
    },
  );
  const updateLessonOrder = vi.fn(async (input: { lessonIds: string[] }) => {
    lessons.sort(
      (a, b) => input.lessonIds.indexOf(a.id) - input.lessonIds.indexOf(b.id),
    );
    return { success: true as const };
  });
  const createScene = vi.fn(
    async (input: { lessonId: string; title?: string; html?: string }) => {
      const scene = {
        id: next("scene", scenes.length),
        lessonId: input.lessonId,
        title: input.title ?? "New Scene",
      };
      scenes.push(scene);
      return { ...scene, courseId: "course-1" };
    },
  );
  const updateScene = vi.fn(
    async (input: { sceneId: string; updates?: { title?: string } }) => {
      const scene = scenes.find((row) => row.id === input.sceneId);
      if (scene && input.updates?.title) scene.title = input.updates.title;
      return { ...scene, lessonId: scene?.lessonId, courseId: "course-1" };
    },
  );
  const reorderScenes = vi.fn(async (input: { sceneIds: string[] }) => {
    scenes.sort(
      (a, b) => input.sceneIds.indexOf(a.id) - input.sceneIds.indexOf(b.id),
    );
    return { courseId: "course-1" };
  });
  const getLessonScenes = vi.fn(async (input: { lessonId: string }) =>
    scenes.filter((scene) => scene.lessonId === input.lessonId),
  );
  const listLessons = vi.fn(async (input: { courseId: string }) => ({
    items: lessons.filter((lesson) => lesson.courseId === input.courseId),
  }));

  return {
    caller: {
      course: {
        create,
        list,
        getById,
        createLesson,
        updateLesson,
        updateLessonOrder,
        listLessons,
      },
      scene: { createScene, updateScene, reorderScenes, getLessonScenes },
    } as unknown as TrpcCaller,
    list,
    getById,
    create,
    createLesson,
    updateLesson,
    updateLessonOrder,
    createScene,
    updateScene,
    reorderScenes,
  };
}

async function post(body: unknown, caller: TrpcCaller) {
  const request = new Request("https://app.scibly.com/api/mcp", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
    },
    body: JSON.stringify(body),
  });

  const response = await handleMcpRequest(request, {
    caller,
    session: { user: { id: "user-1" } as Principal["user"] },
  });

  return { response, body: await readRpc(response) };
}

/** A 2025-era exchange comes back as one SSE frame; a modern one as plain JSON. */
async function readRpc(response: Response) {
  const text = await response.text();
  const frame = text.match(/^data: (.*)$/m);
  return JSON.parse(frame ? frame[1]! : text);
}

const rpc = (method: string, params?: unknown) => ({
  jsonrpc: "2.0",
  id: 1,
  method,
  params,
});

describe("the tool surface an external agent sees", () => {
  // Spelled out rather than compared to MCP_TOOL_NAMES: a test that reads the
  // allow-list cannot notice the allow-list is missing a tool.
  const EXPECTED_SURFACE = [
    "createCourse",
    "createLesson",
    "createScene",
    "getAvailableMembers",
    "getCourseById",
    "getCourseStats",
    "getDashboardStats",
    "getEditorSchema",
    "getOrganization",
    "getSceneContent",
    "insertContent",
    "listCourses",
    "listEnrolledCourses",
    "listEnrollments",
    "listInvitations",
    "listLessons",
    "listMembers",
    "listMyOrganizations",
    "listScenes",
    "loadSkill",
    "reorderLessons",
    "reorderScenes",
    "updateLesson",
    "updateScene",
  ];

  it("MCP3: offers exactly the reads and the structure mutations", async () => {
    const { body } = await post(rpc("tools/list"), fakeCaller().caller);

    expect(
      body.result.tools.map((tool: { name: string }) => tool.name).sort(),
    ).toEqual(EXPECTED_SURFACE);
    // The content tools are registered beside the allow-list, not from it.
    expect(
      [...MCP_TOOL_NAMES, "getSceneContent", "insertContent"].sort(),
    ).toEqual(EXPECTED_SURFACE);
  });

  it("MCP3: withholds the delete tools an author has to confirm in person", async () => {
    const { body } = await post(rpc("tools/list"), fakeCaller().caller);

    const names = body.result.tools.map((tool: { name: string }) => tool.name);

    expect(names).not.toContain("deleteScenes");
    expect(names).not.toContain("deleteLessons");
  });

  it("MCP4: takes scene content through the content tool and nowhere else", async () => {
    const { body } = await post(rpc("tools/list"), fakeCaller().caller);

    const takingHtml = body.result.tools
      .filter((tool: { name: string; inputSchema: object }) =>
        Object.keys(
          (tool.inputSchema as { properties?: object }).properties ?? {},
        ).includes("html"),
      )
      .map((tool: { name: string }) => tool.name);

    expect(takingHtml).toEqual(["insertContent"]);
  });

  it("MCP3: offers no way to cite a source (ADR 0005)", async () => {
    const { body } = await post(rpc("tools/list"), fakeCaller().caller);

    const named = body.result.tools.flatMap((tool: { inputSchema: object }) =>
      Object.keys(
        (tool.inputSchema as { properties?: object }).properties ?? {},
      ),
    );

    expect(named).not.toContain("sourceIds");
  });

  it("MCP1: lets an agent name the organization, and name the ones it may", async () => {
    // The endpoint names no organization, so an agent passes one per call, the
    // way the in-app agent does; the procedure behind each tool authorizes it.
    const { body } = await post(rpc("tools/list"), fakeCaller().caller);

    const tools: { name: string; inputSchema: { properties?: object } }[] =
      body.result.tools;
    const named = (name: string) =>
      Object.keys(
        tools.find((tool) => tool.name === name)?.inputSchema.properties ?? {},
      );

    expect(named("listCourses")).toContain("orgSlug");
    expect(named("createCourse")).toContain("orgSlug");
    expect(tools.map((tool) => tool.name)).toContain("listMyOrganizations");
  });
});

describe("calling a tool over MCP", () => {
  it("MCP1: answers with the real data of the organization the agent named", async () => {
    const { caller, list } = fakeCaller();

    const { body } = await post(
      rpc("tools/call", {
        name: "listCourses",
        arguments: { orgSlug: "acme", limit: 6 },
      }),
      caller,
    );

    expect(list).toHaveBeenCalledWith(
      expect.objectContaining({ orgSlug: "acme", limit: 6 }),
    );
    expect(JSON.parse(body.result.content[0].text)).toEqual(COURSES);
  });

  it("MCP1: passes the named organization straight to the procedure that authorizes it", async () => {
    const { caller, list } = fakeCaller();

    await post(
      rpc("tools/call", {
        name: "listCourses",
        arguments: { limit: 6, orgSlug: "rival" },
      }),
      caller,
    );

    // Nothing is substituted on the way through: `course.list` refuses an
    // organization this user is not a member of, exactly as it does in the app.
    expect(list).toHaveBeenCalledWith(
      expect.objectContaining({ orgSlug: "rival" }),
    );
  });

  it("MCP1: passes a resource id to the procedure that authorizes it", async () => {
    const { caller, getById } = fakeCaller();

    await post(
      rpc("tools/call", {
        name: "getCourseById",
        arguments: { courseId: "course-1" },
      }),
      caller,
    );

    expect(getById).toHaveBeenCalledWith({ courseId: "course-1" });
  });

  it("MCP3: creates a course and reads back the one it just made", async () => {
    const { caller, create } = fakeCaller();

    const { body: created } = await post(
      rpc("tools/call", {
        name: "createCourse",
        arguments: { orgSlug: "acme", title: "Spotting phishing, part two" },
      }),
      caller,
    );
    const courseId = JSON.parse(created.result.content[0].text).id;

    const { body: read } = await post(
      rpc("tools/call", { name: "getCourseById", arguments: { courseId } }),
      caller,
    );

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        orgSlug: "acme",
        title: "Spotting phishing, part two",
      }),
    );
    expect(JSON.parse(read.result.content[0].text)).toMatchObject({
      id: courseId,
      title: "Spotting phishing, part two",
    });
  });

  it("MCP3: builds a lesson's structure and reorders what it built", async () => {
    const { caller, createLesson, createScene, updateScene, reorderScenes } =
      fakeCaller();

    await post(
      rpc("tools/call", {
        name: "createLesson",
        arguments: { courseId: "course-1", title: "Phishing basics" },
      }),
      caller,
    );
    for (const title of ["Second scene", "Third scene"]) {
      await post(
        rpc("tools/call", {
          name: "createScene",
          arguments: { lessonId: "lesson-1", title },
        }),
        caller,
      );
    }
    await post(
      rpc("tools/call", {
        name: "updateScene",
        arguments: { sceneId: "scene-1", updates: { title: "Renamed" } },
      }),
      caller,
    );
    await post(
      rpc("tools/call", {
        name: "reorderScenes",
        arguments: { lessonId: "lesson-1", sceneIds: ["scene-2", "scene-1"] },
      }),
      caller,
    );

    expect(createLesson).toHaveBeenCalledWith({
      courseId: "course-1",
      title: "Phishing basics",
    });
    expect(createScene).toHaveBeenCalledTimes(2);
    expect(updateScene).toHaveBeenCalledWith({
      sceneId: "scene-1",
      updates: { title: "Renamed" },
    });
    expect(reorderScenes).toHaveBeenCalledWith({
      lessonId: "lesson-1",
      sceneIds: ["scene-2", "scene-1"],
    });

    const { body } = await post(
      rpc("tools/call", {
        name: "listScenes",
        arguments: { lessonId: "lesson-1" },
      }),
      caller,
    );
    expect(
      JSON.parse(body.result.content[0].text).map(
        (scene: { id: string }) => scene.id,
      ),
    ).toEqual(["scene-2", "scene-1"]);
  });

  it("MCP3: retitles and reorders lessons through their own procedures", async () => {
    const { caller, updateLesson, updateLessonOrder } = fakeCaller();

    await post(
      rpc("tools/call", {
        name: "updateLesson",
        arguments: {
          courseId: "course-1",
          lessonId: "lesson-1",
          title: "Renamed lesson",
        },
      }),
      caller,
    );
    await post(
      rpc("tools/call", {
        name: "reorderLessons",
        arguments: {
          courseId: "course-1",
          lessonIds: ["lesson-2", "lesson-1"],
        },
      }),
      caller,
    );

    expect(updateLesson).toHaveBeenCalledWith(
      expect.objectContaining({
        lessonId: "lesson-1",
        title: "Renamed lesson",
      }),
    );
    expect(updateLessonOrder).toHaveBeenCalledWith({
      courseId: "course-1",
      lessonIds: ["lesson-2", "lesson-1"],
    });
  });

  it("MCP3: discards scene content an agent sends anyway", async () => {
    const { caller, createScene } = fakeCaller();

    await post(
      rpc("tools/call", {
        name: "createScene",
        arguments: {
          lessonId: "lesson-1",
          title: "Smuggled",
          html: "<p>written from outside</p>",
          sourceIds: ["source-1"],
        },
      }),
      caller,
    );

    expect(createScene).toHaveBeenCalledWith({
      lessonId: "lesson-1",
      title: "Smuggled",
    });
  });

  it("MCP1: does not expose a tool that was left off the surface", async () => {
    const { body } = await post(
      rpc("tools/call", { name: "deleteCourse", arguments: { courseId: "c" } }),
      fakeCaller().caller,
    );

    expect(body.error).toBeDefined();
  });
});

describe("writing and reading scene content from outside", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    draftScene();
    writeSceneHtml.mockResolvedValue({ success: true });
    getSceneContent.mockResolvedValue({
      sceneId: "scene-1",
      html: "<p>Already there</p>",
      sourceIds: ["source-1"],
    });
  });

  it("MCP4: writes the agent's HTML into the scene, as the author", async () => {
    const { body } = await post(
      rpc("tools/call", {
        name: "insertContent",
        arguments: {
          sceneId: "scene-1",
          html: "<p>Written from outside</p>",
          mode: "append",
        },
      }),
      fakeCaller().caller,
    );

    expect(writeSceneHtml).toHaveBeenCalledWith({
      sceneId: "scene-1",
      html: "<p>Written from outside</p>",
      mode: "append",
      user: expect.objectContaining({ id: "user-1" }),
    });
    expect(JSON.parse(body.result.content[0].text)).toEqual({
      sceneId: "scene-1",
      success: true,
    });
  });

  it("MCP4: reads back what the scene holds right now, and no lineage (ADR 0005)", async () => {
    const { body } = await post(
      rpc("tools/call", {
        name: "getSceneContent",
        arguments: { sceneId: "scene-1" },
      }),
      fakeCaller().caller,
    );

    expect(JSON.parse(body.result.content[0].text)).toEqual({
      sceneId: "scene-1",
      html: "<p>Already there</p>",
    });
  });

  it("MCP4: refuses anything published, without reaching the document", async () => {
    requireDraftSceneContentAccess.mockRejectedValue(
      new AppError({
        code: "BAD_REQUEST",
        applicationCode: "api.bad_request",
        message: "Cannot edit a published scene.",
      }),
    );

    const { body } = await post(
      rpc("tools/call", {
        name: "insertContent",
        arguments: { sceneId: "scene-1", html: "<p>Nope</p>" },
      }),
      fakeCaller().caller,
    );

    expect(body.result.isError).toBe(true);
    expect(body.result.content[0].text).toContain("published");
    expect(writeSceneHtml).not.toHaveBeenCalled();
  });

  it("MCP4: hands back the refusal naming what was wrong with the HTML", async () => {
    writeSceneHtml.mockResolvedValue({
      success: false,
      refused: true,
      error: 'Unknown node type "quiz".',
    });

    const { body } = await post(
      rpc("tools/call", {
        name: "insertContent",
        arguments: {
          sceneId: "scene-1",
          html: '<div data-type="quiz"></div>',
        },
      }),
      fakeCaller().caller,
    );

    expect(body.result.isError).toBe(true);
    expect(body.result.content[0].text).toContain("quiz");
  });
});

describe("refusing a request that never gets as far as a tool", () => {
  const request = new Request("https://app.scibly.com/api/mcp", {
    method: "POST",
  });

  it("MCP1: tells an agent with no token where to go and get one", () => {
    const response = mcpUnauthorized(request);

    expect(response.status).toBe(401);
    expect(response.headers.get("WWW-Authenticate")).toBe(
      'Bearer resource_metadata="https://app.scibly.com/.well-known/oauth-protected-resource"',
    );
  });

  it("MCP1: shapes every refusal as a JSON-RPC error object", async () => {
    const response = jsonRpcError(-32001, "Forbidden", { status: 403 });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      jsonrpc: "2.0",
      error: { code: -32001 },
    });
  });
});
