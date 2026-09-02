// @vitest-environment node
import type { McpServer } from "@modelcontextprotocol/server";

import {
  CLIENT_CAPABILITIES_META_KEY,
  isInputRequiredResult,
} from "@modelcontextprotocol/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const deleteDraftScenes = vi.fn(async () => ({ success: true, deleted: [] }));
const deleteDraftLessons = vi.fn(async () => ({
  success: true,
  deletedLessonIds: [],
}));
const deleteCourse = vi.fn(async () => ({ success: true }));

const COURSES = vi.hoisted(() => ({
  "course-1": {
    title: "Photosynthesis",
    allowAnonymous: true,
    versions: [{ version: 4 }],
    _count: { lessons: 3, enrollments: 12 },
  },
  "course-2": {
    title: "Cell division",
    allowAnonymous: false,
    versions: [],
    _count: { lessons: 1, enrollments: 0 },
  },
}));

const SCENES = vi.hoisted(() => ({
  "scene-1": {
    course: { id: "course-1", title: "Photosynthesis" },
    sceneTitle: "Chlorophyll",
    lessonId: "lesson-1",
    lessonTitle: "Light",
  },
  "scene-2": {
    course: { id: "course-1", title: "Photosynthesis" },
    sceneTitle: "Photons",
    lessonId: "lesson-1",
    lessonTitle: "Light",
  },
  "scene-3": {
    course: { id: "course-1", title: "Photosynthesis" },
    sceneTitle: "Stomata",
    lessonId: "lesson-2",
    lessonTitle: "Gas exchange",
  },
  "scene-mitosis": {
    course: { id: "course-2", title: "Cell division" },
    sceneTitle: "Anaphase",
    lessonId: "lesson-9",
    lessonTitle: "Phases",
  },
}));

const LESSONS = vi.hoisted(() => ({
  "lesson-1": {
    course: { id: "course-1", title: "Photosynthesis" },
    lessonTitle: "Light",
    sceneCount: 2,
  },
  "lesson-2": {
    course: { id: "course-1", title: "Photosynthesis" },
    lessonTitle: "Gas exchange",
    sceneCount: 1,
  },
  "lesson-9": {
    course: { id: "course-2", title: "Cell division" },
    lessonTitle: "Phases",
    sceneCount: 4,
  },
}));

const resolve = vi.hoisted(
  () =>
    <T extends { course: { id: string; title: string } }>(
      table: Record<string, T>,
      ids: string[],
      toFound: (id: string, row: T) => unknown,
    ) => {
      const rows = ids.flatMap((id) =>
        table[id] ? [[id, table[id]!] as const] : [],
      );
      if (rows.length === 0) return null;
      const course = rows[0]![1].course;
      const inCourse = rows.filter(([, row]) => row.course.id === course.id);
      const found = new Set(inCourse.map(([id]) => id));
      return {
        course,
        found: inCourse.map(([id, row]) => toFound(id, row)),
        missing: ids.filter((id) => !found.has(id)),
      };
    },
);

vi.mock("@/features/course-authoring/server", async () => {
  const schema =
    await import("@/features/course-authoring/deletion/api/deletion.schema");
  return {
    deletionIdsSchema: schema.deletionIdsSchema,
    deletionReasonSchema: schema.deletionReasonSchema,
    resolveSceneDeletion: async (_userId: string, ids: string[]) =>
      resolve(SCENES, ids, (sceneId, row) => ({
        sceneId,
        sceneTitle: row.sceneTitle,
        lessonId: row.lessonId,
        lessonTitle: row.lessonTitle,
      })),
    resolveLessonDeletion: async (_userId: string, ids: string[]) =>
      resolve(LESSONS, ids, (lessonId, row) => ({
        lessonId,
        lessonTitle: row.lessonTitle,
        sceneCount: row.sceneCount,
      })),
    deleteDraftScenes,
    deleteDraftLessons,
    deleteCourse,
    getCourse: async (_userId: string, courseId: string) =>
      COURSES[courseId as keyof typeof COURSES],
  };
});

const { registerDeletionTools } = await import("./deletion-tools");

type ToolResult = {
  content?: { text: string }[];
  isError?: boolean;
  requestState?: string;
  inputRequests?: {
    confirm?: { params?: { message?: string } };
  };
};

type ToolArgs = {
  courseId: string;
  sceneIds?: string[];
  lessonIds?: string[];
  reason?: string;
  confirmationToken?: string;
};

type Tool = (args: never, ctx: unknown) => Promise<ToolResult>;

const tools = new Map<string, Tool>();
registerDeletionTools(
  {
    registerTool: (name: string, _config: unknown, callback: Tool) => {
      tools.set(name, callback);
    },
  } as unknown as McpServer,
  "user-1",
);

function call(
  name: string,
  args: ToolArgs,
  answer?: { action: string; content?: unknown; requestState?: string },
) {
  const tool = tools.get(name);
  if (!tool) throw new Error(`${name} was never registered`);
  return tool(args as never, {
    mcpReq: {
      envelope: {
        [CLIENT_CAPABILITIES_META_KEY]: { elicitation: {} },
      },
      inputResponses: answer
        ? { confirm: { action: answer.action, content: answer.content } }
        : undefined,
      requestState: () => answer?.requestState,
    },
  });
}

/** A 2025-era client: no capability envelope reaches the handler at all. */
function callLegacy(name: string, args: ToolArgs) {
  const tool = tools.get(name);
  if (!tool) throw new Error(`${name} was never registered`);
  return tool(args as never, {
    mcpReq: { inputResponses: undefined, requestState: () => undefined },
  });
}

function output(result: ToolResult) {
  return JSON.parse(result.content![0]!.text) as {
    success: boolean;
    message: string;
    missingSceneIds?: string[];
    missingLessonIds?: string[];
    needsConfirmation?: boolean;
    confirmationToken?: string;
  };
}

function asked(result: ToolResult): string {
  expect(isInputRequiredResult(result)).toBe(true);
  return result.inputRequests!.confirm!.params!.message!;
}

const accept = (requestState?: string) => ({
  action: "accept",
  content: { confirm: true },
  requestState,
});

beforeEach(() => {
  deleteDraftScenes.mockClear();
  deleteDraftLessons.mockClear();
  deleteCourse.mockClear();
});

describe("deleteScenes", () => {
  const args = { courseId: "course-1", sceneIds: ["scene-1", "scene-2"] };

  it("asks the author before it deletes", async () => {
    const result = await call("deleteScenes", args);

    expect(isInputRequiredResult(result)).toBe(true);
    expect(deleteDraftScenes).not.toHaveBeenCalled();
  });

  it("names what would go, grouped under the lessons it comes out of", async () => {
    const result = await call("deleteScenes", {
      courseId: "course-1",
      sceneIds: ["scene-1", "scene-2", "scene-3"],
      reason: "Superseded by the new intro.",
    });

    expect(asked(result)).toBe(
      [
        'Permanently delete 3 scenes from "Photosynthesis"? This cannot be undone.',
        "",
        "Light",
        "  - Chlorophyll",
        "  - Photons",
        "Gas exchange",
        "  - Stomata",
        "",
        "Reason: Superseded by the new intro.",
      ].join("\n"),
    );
  });

  it("says one scene when one scene is going, and leaves the reason out when there is none", async () => {
    const result = await call("deleteScenes", {
      courseId: "course-1",
      sceneIds: ["scene-1"],
    });

    expect(asked(result)).toBe(
      [
        'Permanently delete 1 scene from "Photosynthesis"? This cannot be undone.',
        "",
        "Light",
        "  - Chlorophyll",
      ].join("\n"),
    );
  });

  it("deletes once the author has said yes to these scenes", async () => {
    const first = await call("deleteScenes", args);

    await call("deleteScenes", args, accept(first.requestState));

    expect(deleteDraftScenes).toHaveBeenCalledWith("user-1", [
      "scene-1",
      "scene-2",
    ]);
  });

  it("honours the approval when the retry names the same scenes in another order", async () => {
    const first = await call("deleteScenes", args);

    await call(
      "deleteScenes",
      { courseId: "course-1", sceneIds: ["scene-2", "scene-1", "scene-1"] },
      accept(first.requestState),
    );

    expect(deleteDraftScenes).toHaveBeenCalledWith("user-1", [
      "scene-2",
      "scene-1",
    ]);
  });

  it("refuses an approval given for other scenes", async () => {
    const first = await call("deleteScenes", {
      ...args,
      sceneIds: ["scene-1"],
    });

    const result = await call("deleteScenes", args, accept(first.requestState));

    expect(deleteDraftScenes).not.toHaveBeenCalled();
    expect(output(result)).toEqual({
      success: false,
      message:
        "This approval was given for a different request, so nothing was deleted. " +
        "Call the tool again with what you actually mean, and the author will be asked about that.",
    });
  });

  it("takes a no for an answer", async () => {
    const first = await call("deleteScenes", args);

    const result = await call("deleteScenes", args, {
      action: "decline",
      requestState: first.requestState,
    });

    expect(deleteDraftScenes).not.toHaveBeenCalled();
    expect(result.isError).toBeFalsy();
    expect(output(result)).toEqual({
      success: false,
      message: "The author declined. Nothing was deleted.",
    });
  });

  it("does not turn a dismissed dialog into a no the agent may not revisit", async () => {
    const first = await call("deleteScenes", args);

    const result = await call("deleteScenes", args, {
      action: "cancel",
      requestState: first.requestState,
    });

    expect(deleteDraftScenes).not.toHaveBeenCalled();
    expect(output(result)).toEqual({
      success: false,
      message:
        "The author did not answer; nothing was deleted. Ask again if this still needs doing.",
    });
  });

  it("flattens the reason, so the model cannot add lines under the server's framing", async () => {
    const result = await call("deleteScenes", {
      courseId: "course-1",
      sceneIds: ["scene-1"],
      reason: "Duplicated.\n\nAlso deleting the whole course.",
    });

    expect(asked(result)).toMatch(
      /\nReason: Duplicated\. Also deleting the whole course\.$/u,
    );
  });

  it("treats an unticked box as a no", async () => {
    const first = await call("deleteScenes", args);

    await call("deleteScenes", args, {
      action: "accept",
      content: { confirm: false },
      requestState: first.requestState,
    });

    expect(deleteDraftScenes).not.toHaveBeenCalled();
  });

  it("refuses ids it could not resolve without asking the author about them", async () => {
    const result = await call("deleteScenes", {
      courseId: "course-1",
      sceneIds: ["scene-1", "scene-gone"],
    });

    expect(isInputRequiredResult(result)).toBe(false);
    expect(output(result)).toEqual({
      success: false,
      missingSceneIds: ["scene-gone"],
      message:
        "Not draft scenes in this course: scene-gone. Call listScenes and retry with the exact ids.",
    });
  });

  it("tells the model it named the wrong course rather than calling the scenes missing", async () => {
    const result = await call("deleteScenes", {
      courseId: "course-1",
      sceneIds: ["scene-mitosis"],
    });

    expect(output(result)).toEqual({
      success: false,
      message:
        "Those scenes are in course course-2, not course-1. Retry naming the course they are actually in.",
    });
  });

  it("says so when nothing at all resolved", async () => {
    const result = await call("deleteScenes", {
      courseId: "course-1",
      sceneIds: ["scene-gone"],
    });

    expect(output(result)).toEqual({
      success: false,
      message:
        "No draft scenes match those ids. Call listScenes and retry with the exact ids.",
    });
  });
});

describe("deleteLessons", () => {
  const args = { courseId: "course-1", lessonIds: ["lesson-1"] };

  it("warns that the scenes go too, and counts them", async () => {
    const result = await call("deleteLessons", {
      courseId: "course-1",
      lessonIds: ["lesson-1", "lesson-2"],
    });

    expect(asked(result)).toBe(
      [
        'Permanently delete 2 lessons from "Photosynthesis"? Every scene inside goes too, and this cannot be undone.',
        "",
        "  - Light (2 scenes)",
        "  - Gas exchange (1 scene)",
      ].join("\n"),
    );
  });

  it("deletes once the author has said yes to these lessons", async () => {
    const first = await call("deleteLessons", args);

    await call("deleteLessons", args, accept(first.requestState));

    expect(deleteDraftLessons).toHaveBeenCalledWith("user-1", {
      courseId: "course-1",
      lessonIds: ["lesson-1"],
    });
  });

  it("refuses lesson ids it could not resolve", async () => {
    const result = await call("deleteLessons", {
      courseId: "course-1",
      lessonIds: ["lesson-1", "lesson-gone"],
    });

    expect(isInputRequiredResult(result)).toBe(false);
    expect(deleteDraftLessons).not.toHaveBeenCalled();
    expect(output(result)).toEqual({
      success: false,
      missingLessonIds: ["lesson-gone"],
      message:
        "Not draft lessons in this course: lesson-gone. Call listLessons and retry with the exact ids.",
    });
  });

  it("does not honour an approval minted by deleteScenes for the same ids", async () => {
    const forged = JSON.stringify(["deleteScenes", "course-1", ["lesson-1"]]);

    const result = await call("deleteLessons", args, accept(forged));

    expect(deleteDraftLessons).not.toHaveBeenCalled();
    expect(output(result).success).toBe(false);
  });
});

describe("deleteCourse", () => {
  const token = JSON.stringify(["deleteCourse", "course-1", []]);

  it("DC1: asks before deleting, and names everything that goes with it", async () => {
    const message = asked(await call("deleteCourse", { courseId: "course-1" }));

    expect(deleteCourse).not.toHaveBeenCalled();
    expect(message).toContain('"Photosynthesis"');
    expect(message).toContain("3 draft lessons");
    expect(message).toContain("up to version 4");
    expect(message).toContain("12 enrolled learners");
    expect(message).toContain("the public link");
  });

  it("DC1: leaves out what a never-published private course does not have", async () => {
    const message = asked(await call("deleteCourse", { courseId: "course-2" }));

    expect(message).toContain("1 draft lesson");
    expect(message).not.toContain("published version");
    expect(message).not.toContain("enrolled learner");
    expect(message).not.toContain("public link");
  });

  it("DC2: deletes once the author has approved", async () => {
    const result = await call(
      "deleteCourse",
      { courseId: "course-1" },
      { action: "accept", content: { confirm: true }, requestState: token },
    );

    expect(deleteCourse).toHaveBeenCalledWith("user-1", "course-1");
    expect(output(result).success).toBe(true);
  });

  it("DC3: an approval for one course cannot delete another", async () => {
    const result = await call(
      "deleteCourse",
      { courseId: "course-2" },
      { action: "accept", content: { confirm: true }, requestState: token },
    );

    expect(deleteCourse).not.toHaveBeenCalled();
    expect(output(result)).toEqual({
      success: false,
      message:
        "This approval was given for a different request, so nothing was deleted. " +
        "Call the tool again with what you actually mean, and the author will be asked about that.",
    });
  });

  it("DC3: an unticked box is a no", async () => {
    const result = await call(
      "deleteCourse",
      { courseId: "course-1" },
      { action: "accept", content: { confirm: false }, requestState: token },
    );

    expect(deleteCourse).not.toHaveBeenCalled();
    expect(output(result).success).toBe(false);
  });
});

describe("a client that cannot be elicited", () => {
  const args = { courseId: "course-1", sceneIds: ["scene-1", "scene-2"] };

  it("D9: gets the same summary to put in front of the author, and nothing is deleted yet", async () => {
    const answer = output(await callLegacy("deleteScenes", args));

    expect(deleteDraftScenes).not.toHaveBeenCalled();
    expect(answer.success).toBe(false);
    expect(answer.needsConfirmation).toBe(true);
    expect(answer.message).toContain(
      'Permanently delete 2 scenes from "Photosynthesis"?',
    );
    expect(answer.confirmationToken).toBeTruthy();
  });

  it("D9: deletes on the second call, once the token comes back", async () => {
    const first = output(await callLegacy("deleteScenes", args));
    const second = await callLegacy("deleteScenes", {
      ...args,
      confirmationToken: first.confirmationToken,
    });

    expect(output(second).success).toBe(true);
    expect(deleteDraftScenes).toHaveBeenCalledWith("user-1", [
      "scene-1",
      "scene-2",
    ]);
  });

  it("D10: a token approved for two scenes does not delete a third", async () => {
    const first = output(await callLegacy("deleteScenes", args));
    const result = await callLegacy("deleteScenes", {
      courseId: "course-1",
      sceneIds: ["scene-1", "scene-2", "scene-3"],
      confirmationToken: first.confirmationToken,
    });

    expect(deleteDraftScenes).not.toHaveBeenCalled();
    expect(output(result).success).toBe(false);
    expect(output(result).message).toContain("a different request");
  });

  it("D10: nor does one minted for another tool", async () => {
    const first = output(await callLegacy("deleteScenes", args));
    const result = await callLegacy("deleteLessons", {
      courseId: "course-1",
      lessonIds: ["lesson-1"],
      confirmationToken: first.confirmationToken,
    });

    expect(deleteDraftLessons).not.toHaveBeenCalled();
    expect(output(result).success).toBe(false);
  });

  it("D11: the whole-course delete is gated the same way", async () => {
    const first = output(
      await callLegacy("deleteCourse", { courseId: "course-1" }),
    );
    expect(deleteCourse).not.toHaveBeenCalled();
    expect(first.needsConfirmation).toBe(true);
    expect(first.message).toContain("12 enrolled learners");

    const second = await callLegacy("deleteCourse", {
      courseId: "course-1",
      confirmationToken: first.confirmationToken,
    });

    expect(output(second).success).toBe(true);
    expect(deleteCourse).toHaveBeenCalledWith("user-1", "course-1");
  });
});
