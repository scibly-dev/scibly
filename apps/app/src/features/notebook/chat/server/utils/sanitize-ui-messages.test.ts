import type { NotebookMessage } from "@/features/notebook/chat/contracts";

import { convertToModelMessages } from "ai";
import { describe, expect, it } from "vitest";

import { sanitizeUiMessagesForModel } from "./sanitize-ui-messages";

type Part = NotebookMessage["parts"][number];

function assistant(...parts: Part[]): NotebookMessage {
  return { id: "assistant-1", role: "assistant", parts };
}

const ASK: NotebookMessage = {
  id: "user-1",
  role: "user",
  parts: [{ type: "text", text: "Continue" }],
};

const PENDING_CLIENT_CALL: Part = {
  type: "tool-insertContent",
  toolCallId: "call-insert",
  state: "input-available",
  input: { sceneId: "scene-1", html: "<p>The draft's last scene.</p>" },
};

const PENDING_APPROVAL: Part = {
  type: "tool-deleteLessons",
  toolCallId: "call-delete",
  state: "approval-requested",
  input: { courseId: "course-1", lessons: [] },
  approval: { id: "approval-1" },
};

async function unansweredCallIds(messages: NotebookMessage[]) {
  const model = await convertToModelMessages(messages);
  const answered = new Set<string>();
  for (const message of model) {
    if (message.role !== "tool" || typeof message.content === "string")
      continue;
    for (const part of message.content) {
      if (part.type === "tool-result") answered.add(part.toolCallId);
    }
  }

  return model
    .filter((message) => message.role === "assistant")
    .flatMap((message) =>
      typeof message.content === "string" ? [] : message.content,
    )
    .filter((part) => part.type === "tool-call")
    .map((part) => part.toolCallId)
    .filter((id) => !answered.has(id));
}

describe("a call the browser never answered still gets a result", () => {
  it("an interrupted client call reaches the model as an error", () => {
    const [message] = sanitizeUiMessagesForModel([
      assistant(PENDING_CLIENT_CALL),
    ]);

    expect(message?.parts[0]).toMatchObject({
      toolCallId: "call-insert",
      state: "output-error",
    });
  });

  it("an unanswered approval reaches it as a denial", () => {
    const [message] = sanitizeUiMessagesForModel([assistant(PENDING_APPROVAL)]);

    expect(message?.parts[0]).toMatchObject({
      toolCallId: "call-delete",
      state: "output-denied",
      approval: { id: "approval-1", approved: false },
    });
  });

  it("an approval the author granted is left for the agent to run", () => {
    const granted: Part = {
      ...PENDING_APPROVAL,
      state: "approval-responded",
      approval: { id: "approval-1", approved: true },
    };

    expect(sanitizeUiMessagesForModel([assistant(granted)])[0]?.parts[0]).toBe(
      granted,
    );
  });

  it("the next turn is sendable, which it was not before", async () => {
    const history = [
      ASK,
      assistant(PENDING_CLIENT_CALL, PENDING_APPROVAL),
      ASK,
    ];

    expect(await unansweredCallIds(history)).toEqual([
      "call-insert",
      "call-delete",
    ]);
    expect(
      await unansweredCallIds(sanitizeUiMessagesForModel(history)),
    ).toEqual([]);
  });
});
