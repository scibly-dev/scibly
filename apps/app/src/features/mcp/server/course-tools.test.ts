// @vitest-environment node
import type { McpServer } from "@modelcontextprotocol/server";

import { describe, expect, it, vi } from "vitest";
import { type z } from "zod";

const updateCourse = vi.fn(async () => ({ id: "course-1" }));

vi.mock("@/features/course-authoring/server", async () => {
  const schema =
    await import("@/features/course-authoring/courses/api/course.schema");
  return { updateCourse, updateCourseSchema: schema.updateCourseSchema };
});

const { registerCourseTools } = await import("./course-tools");

type Tool = (args: never) => Promise<{ content: { text: string }[] }>;

const tools = new Map<string, Tool>();
const schemas = new Map<string, z.ZodObject>();

registerCourseTools(
  {
    registerTool: (
      name: string,
      config: { inputSchema: z.ZodObject },
      callback: Tool,
    ) => {
      tools.set(name, callback);
      schemas.set(name, config.inputSchema);
    },
  } as unknown as McpServer,
  "user-1",
);

describe("updateCourse", () => {
  it("UC1: passes only the fields the agent named", async () => {
    await tools.get("updateCourse")!({
      courseId: "course-1",
      title: "Photosynthesis, revised",
      maxTries: null,
    } as never);

    expect(updateCourse).toHaveBeenCalledWith("user-1", {
      courseId: "course-1",
      title: "Photosynthesis, revised",
      maxTries: null,
    });
  });

  it("UC2: cannot make a course public, since that approval is setCoursePublic's to ask", () => {
    expect(
      schemas
        .get("updateCourse")!
        .parse({ courseId: "course-1", allowAnonymous: true }),
    ).toEqual({ courseId: "course-1" });
  });
});
