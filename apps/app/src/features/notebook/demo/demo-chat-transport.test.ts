import { createShowcaseStore, showcaseFixture } from "@scibly/showcase";
import { describe, expect, it } from "vitest";

import {
  createDemoChatTransport,
  createDevScriptController,
  shouldResumeDemoReply,
} from "./demo-chat-transport";

async function drain(stream: ReadableStream<unknown>): Promise<void> {
  const reader = stream.getReader();
  while (!(await reader.read()).done) {}
}

async function collect(stream: ReadableStream<unknown>): Promise<unknown[]> {
  const reader = stream.getReader();
  const chunks: unknown[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return chunks;
    chunks.push(value);
  }
}

describe("createDemoChatTransport", () => {
  it("mirrors every scripted courseDelta and title chunk into the showcase store", async () => {
    const store = createShowcaseStore(showcaseFixture);
    const transport = createDemoChatTransport(showcaseFixture, store, {
      delayMs: 0,
    });

    const stream = await transport.sendMessages({
      trigger: "submit-message",
      chatId: "demo-chat-transport-test",
      messageId: undefined,
      messages: [],
      abortSignal: undefined,
    });
    await drain(stream);

    const snapshot = store.getSnapshot();
    expect(snapshot.title).toBe("Cyber safety at work");
    expect(snapshot.linkedCourse?.id).toBe(showcaseFixture.course.id);
    expect(snapshot.linkedCourse?.lessons).toHaveLength(
      showcaseFixture.course.lessons.length,
    );
    for (const lesson of snapshot.linkedCourse?.lessons ?? []) {
      const source = showcaseFixture.course.lessons.find(
        (candidate) => candidate.id === lesson.id,
      );
      expect(lesson.scenes).toHaveLength(source?.scenes.length ?? -1);
    }
  });

  it("replays the timeline once: a second send returns an empty stream", async () => {
    const store = createShowcaseStore(showcaseFixture);
    const transport = createDemoChatTransport(showcaseFixture, store, {
      delayMs: 0,
    });
    const sendOptions = {
      trigger: "submit-message" as const,
      chatId: "demo-chat-transport-test-2",
      messageId: undefined,
      messages: [],
      abortSignal: undefined,
    };

    await drain(await transport.sendMessages(sendOptions));
    const secondStream = await transport.sendMessages(sendOptions);
    const reader = secondStream.getReader();
    expect((await reader.read()).done).toBe(true);
  });

  it("plays a queued dev script through the fallback on a later send", async () => {
    const store = createShowcaseStore(showcaseFixture);
    const devScript = createDevScriptController();
    const transport = createDemoChatTransport(showcaseFixture, store, {
      delayMs: 0,
      devScript,
    });

    await drain(
      await transport.sendMessages({
        trigger: "submit-message",
        chatId: "demo-chat-transport-dev-script",
        messageId: undefined,
        messages: [],
        abortSignal: undefined,
      }),
    );

    devScript.queue({
      parts: [{ type: "chatTitle", title: "Scripted title" }],
    });

    await drain(
      await transport.sendMessages({
        trigger: "submit-message",
        chatId: "demo-chat-transport-dev-script",
        messageId: undefined,
        messages: [
          { id: "demo-assistant-1", role: "assistant", parts: [] },
          { id: "follow-up-1", role: "user", parts: [] },
        ],
        abortSignal: undefined,
      }),
    );

    expect(store.getSnapshot().title).toBe("Scripted title");
  });

  it("plays a queued dev script on the very first send of a fresh page load", async () => {
    const store = createShowcaseStore(showcaseFixture);
    const devScript = createDevScriptController();
    const transport = createDemoChatTransport(showcaseFixture, store, {
      delayMs: 0,
      devScript,
    });

    devScript.queue({
      parts: [{ type: "chatTitle", title: "First-send scripted title" }],
    });

    await drain(
      await transport.sendMessages({
        trigger: "submit-message",
        chatId: "demo-chat-transport-dev-script-first-send",
        messageId: undefined,
        messages: [{ id: "user-1", role: "user", parts: [] }],
        abortSignal: undefined,
      }),
    );

    expect(store.getSnapshot().title).toBe("First-send scripted title");
  });

  it("plays a second queued dev script even though the real transcript now carries its own assistant id", async () => {
    const store = createShowcaseStore(showcaseFixture);
    const devScript = createDevScriptController();
    const transport = createDemoChatTransport(showcaseFixture, store, {
      delayMs: 0,
      devScript,
    });

    devScript.queue({
      parts: [{ type: "chatTitle", title: "Second-turn title" }],
    });

    await drain(
      await transport.sendMessages({
        trigger: "submit-message",
        chatId: "demo-chat-transport-second-turn",
        messageId: undefined,
        messages: [
          { id: "user-1", role: "user", parts: [] },
          { id: "real-assistant-reply-1", role: "assistant", parts: [] },
          { id: "user-2", role: "user", parts: [] },
        ],
        abortSignal: undefined,
      }),
    );

    expect(store.getSnapshot().title).toBe("Second-turn title");
  });

  it("leaves a scripted tool call pending when no output or error is given", async () => {
    const store = createShowcaseStore(showcaseFixture);
    const devScript = createDevScriptController();
    const transport = createDemoChatTransport(showcaseFixture, store, {
      delayMs: 0,
      devScript,
    });

    devScript.queue({
      parts: [
        { type: "tool", name: "askMultipleChoice", input: { question: "?" } },
      ],
    });

    const chunks = await collect(
      await transport.sendMessages({
        trigger: "submit-message",
        chatId: "demo-chat-transport-dev-script-pending-tool",
        messageId: undefined,
        messages: [{ id: "user-1", role: "user", parts: [] }],
        abortSignal: undefined,
      }),
    );

    const chunkTypes = chunks.map((chunk) => (chunk as { type: string }).type);
    expect(chunkTypes).toContain("tool-input-available");
    expect(chunkTypes).not.toContain("tool-output-available");
    expect(chunkTypes).not.toContain("tool-output-error");
  });

  it("resumes parts scripted after a pending tool call once the SDK auto-resubmits", async () => {
    const store = createShowcaseStore(showcaseFixture);
    const devScript = createDevScriptController();
    const transport = createDemoChatTransport(showcaseFixture, store, {
      delayMs: 0,
      devScript,
    });

    devScript.queue({
      parts: [
        { type: "tool", name: "askMultipleChoice", input: { question: "?" } },
        {
          type: "text",
          text: "Should not stream before the card is answered.",
        },
        { type: "chatTitle", title: "Applies after the card is answered" },
      ],
    });

    const firstChunks = await collect(
      await transport.sendMessages({
        trigger: "submit-message",
        chatId: "demo-chat-transport-dev-script-pending-tool-trailing",
        messageId: undefined,
        messages: [{ id: "user-1", role: "user", parts: [] }],
        abortSignal: undefined,
      }),
    );

    const firstChunkTypes = firstChunks.map(
      (chunk) => (chunk as { type: string }).type,
    );
    expect(firstChunkTypes).toContain("tool-input-available");
    expect(firstChunkTypes).not.toContain("text-start");
    expect(store.getSnapshot().title).not.toBe(
      "Applies after the card is answered",
    );

    expect(devScript.hasPending()).toBe(true);
    const secondChunks = await collect(
      await transport.sendMessages({
        trigger: "submit-message",
        chatId: "demo-chat-transport-dev-script-pending-tool-trailing",
        messageId: "demo-assistant-1",
        messages: [
          { id: "user-1", role: "user", parts: [] },
          { id: "demo-assistant-1", role: "assistant", parts: [] },
        ],
        abortSignal: undefined,
      }),
    );

    const secondChunkTypes = secondChunks.map(
      (chunk) => (chunk as { type: string }).type,
    );
    expect(secondChunkTypes).toContain("text-start");
    expect(store.getSnapshot().title).toBe(
      "Applies after the card is answered",
    );

    expect(secondChunkTypes).toContain("start-step");
    expect(devScript.hasPending()).toBe(false);

    const start = secondChunks.find(
      (chunk) => (chunk as { type: string }).type === "start",
    );
    expect((start as { messageId?: string }).messageId).toBeUndefined();
  });

  it("still streams a step for a pending tool call scripted with nothing after it", async () => {
    const store = createShowcaseStore(showcaseFixture);
    const devScript = createDevScriptController();
    const transport = createDemoChatTransport(showcaseFixture, store, {
      delayMs: 0,
      devScript,
    });

    devScript.queue({
      parts: [
        { type: "tool", name: "askMultipleChoice", input: { question: "?" } },
      ],
    });

    await drain(
      await transport.sendMessages({
        trigger: "submit-message",
        chatId: "demo-chat-transport-dev-script-pending-tool-only",
        messageId: undefined,
        messages: [{ id: "user-1", role: "user", parts: [] }],
        abortSignal: undefined,
      }),
    );

    expect(devScript.hasPending()).toBe(true);
    const chunks = await collect(
      await transport.sendMessages({
        trigger: "submit-message",
        chatId: "demo-chat-transport-dev-script-pending-tool-only",
        messageId: "demo-assistant-1",
        messages: [
          { id: "user-1", role: "user", parts: [] },
          { id: "demo-assistant-1", role: "assistant", parts: [] },
        ],
        abortSignal: undefined,
      }),
    );

    const chunkTypes = chunks.map((chunk) => (chunk as { type: string }).type);
    expect(chunkTypes).toContain("start-step");
    expect(devScript.hasPending()).toBe(false);
  });
});

describe("shouldResumeDemoReply", () => {
  const settledToolCall = {
    messages: [
      { id: "user-1", role: "user" as const, parts: [] },
      {
        id: "assistant-1",
        role: "assistant" as const,
        parts: [
          {
            type: "tool-loadSkill" as const,
            toolCallId: "call-1",
            state: "output-available" as const,
            input: { name: "lesson-design" },
            output: { content: "..." },
          },
        ],
      },
    ],
  };

  it("resumes only when the queued script continues the reply on screen", () => {
    const devScript = createDevScriptController();
    devScript.queue({ parts: [], continuation: true });
    expect(shouldResumeDemoReply(devScript, settledToolCall)).toBe(true);
  });

  it("does not resume a turn that merely ended on a resolved tool call", () => {
    const devScript = createDevScriptController();
    expect(shouldResumeDemoReply(devScript, settledToolCall)).toBe(false);
  });

  it("does not resume into a fresh turn the panel queued for the next Send", () => {
    const devScript = createDevScriptController();
    devScript.queue({ parts: [{ type: "text", text: "next turn" }] });
    expect(shouldResumeDemoReply(devScript, settledToolCall)).toBe(false);
  });
});

describe("createDevScriptController", () => {
  it("queues, reports, and consumes at most one script", () => {
    const controller = createDevScriptController();
    expect(controller.hasPending()).toBe(false);
    controller.queue({ parts: [] });
    expect(controller.hasPending()).toBe(true);
    expect(controller.peek()).toEqual({ parts: [] });
    expect(controller.hasPending()).toBe(true);
    expect(controller.consume()).toEqual({ parts: [] });
    expect(controller.hasPending()).toBe(false);
    expect(controller.consume()).toBeNull();
  });
});
