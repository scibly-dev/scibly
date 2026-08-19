import { describe, expect, it } from "vitest";

import { notebookMessageRowsToMessages } from "./notebook-messages";

const CREATED_AT = new Date("2025-01-01T00:00:00.000Z");

function row(id: string, parts: unknown) {
  return { id, role: "assistant", parts, createdAt: CREATED_AT };
}

const READABLE = row("readable", [{ type: "text", text: "Still here." }]);

describe("notebookMessageRowsToMessages", () => {
  it("keeps a stored call whose input still matches its schema", async () => {
    const messages = await notebookMessageRowsToMessages([
      row("valid", [
        {
          type: "tool-insertContent",
          toolCallId: "call-1",
          state: "input-available",
          input: { sceneId: "scene-1", html: "<p>Draft.</p>" },
        },
      ]),
    ]);

    expect(messages.map((message) => message.id)).toEqual(["valid"]);
  });

  it("drops a row with nothing left to read, keeping the rest of the history", async () => {
    const messages = await notebookMessageRowsToMessages([
      row("drifted", [
        {
          type: "tool-insertContent",
          toolCallId: "call-1",
          state: "input-available",
          input: { sceneId: "scene-1" },
        },
      ]),
      READABLE,
    ]);

    expect(messages.map((message) => message.id)).toEqual(["readable"]);
  });

  it("drops only the drifted call, not the reply it was written beside", async () => {
    const [message] = await notebookMessageRowsToMessages([
      row("mixed", [
        { type: "text", text: "Here is the draft." },
        {
          type: "tool-insertContent",
          toolCallId: "call-1",
          state: "input-available",
          input: { sceneId: "scene-1" },
        },
        {
          type: "tool-getSceneContent",
          toolCallId: "call-2",
          state: "output-available",
          input: { sceneId: "scene-1" },
          output: { html: "<p>Draft.</p>", sourceIds: [] },
        },
      ]),
    ]);

    expect(message?.parts.map((part) => part.type)).toEqual([
      "text",
      "tool-getSceneContent",
    ]);
  });

  it("keeps a settled call for a tool the browser does not know", async () => {
    const messages = await notebookMessageRowsToMessages([
      row("server-tool", [
        {
          type: "tool-listScenes",
          toolCallId: "call-1",
          state: "output-available",
          input: { courseId: "course-1" },
          output: { scenes: [] },
        },
      ]),
    ]);

    expect(messages.map((message) => message.id)).toEqual(["server-tool"]);
  });
});
