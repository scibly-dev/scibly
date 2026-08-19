import { createAgentUIStream, tool } from "ai";
import { convertReadableStreamToArray, MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { type NotebookRuntimeContext } from "@/features/notebook/tools/runtime-context";

import { createNotebookAgent } from "./notebook-agent";
import { MODEL_OUTPUT_CHUNK } from "./stream-chat";

// Every other test in this feature asks MODEL_OUTPUT_CHUNK about chunk types written by hand; this file runs a real turn through the real SDK and asks it of the types the SDK actually emits, so a rename upstream lands here rather than on a bill.

const TOOLS = {
  insertContent: tool({
    description: "insert",
    inputSchema: z.object({ value: z.string() }),
    execute: async () => "inserted",
  }),
};

const usage = {
  inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 1, text: 1, reasoning: 0 },
};
const STOPPED = { unified: "stop", raw: "stop" } as const;
const CALLED_TOOLS = { unified: "tool-calls", raw: "tool_use" } as const;

// Only `insertContent` could read this, and the fake provider never gets far
// enough to call it — these turns are read for their chunk types, not their work.
const UNREAD_RUNTIME_CONTEXT = {} as NotebookRuntimeContext;

type DoStream = Extract<
  NonNullable<ConstructorParameters<typeof MockLanguageModelV4>[0]>["doStream"],
  (...args: never[]) => unknown
>;

async function chunkTypesOfTurn(doStream: DoStream): Promise<string[]> {
  const agent = createNotebookAgent({
    model: new MockLanguageModelV4({ doStream }),
    instructions: "you are a course designer",
    tools: TOOLS,
    runtimeContext: UNREAD_RUNTIME_CONTEXT,
    supportsTools: true,
    sourceTier: 2,
  });

  const stream = await createAgentUIStream({
    agent,
    uiMessages: [
      { id: "m1", role: "user", parts: [{ type: "text", text: "hello" }] },
    ],

    onError: () => "failed",
  });

  return (await convertReadableStreamToArray(stream)).map((c) => c.type);
}

const answeredNothing = () =>
  Promise.resolve({
    stream: new ReadableStream({
      start(controller) {
        controller.enqueue({ type: "stream-start", warnings: [] });
        controller.enqueue({ type: "finish", finishReason: STOPPED, usage });
        controller.close();
      },
    }),
  });

describe("what counts as the provider having answered", () => {
  it("text the author can see counts", async () => {
    const types = await chunkTypesOfTurn(() =>
      Promise.resolve({
        stream: new ReadableStream({
          start(controller) {
            controller.enqueue({ type: "stream-start", warnings: [] });
            controller.enqueue({ type: "text-start", id: "t1" });
            controller.enqueue({ type: "text-delta", id: "t1", delta: "hi" });
            controller.enqueue({ type: "text-end", id: "t1" });
            controller.enqueue({
              type: "finish",
              finishReason: STOPPED,
              usage,
            });
            controller.close();
          },
        }),
      }),
    );

    expect(types.filter((t) => MODEL_OUTPUT_CHUNK.test(t))).not.toHaveLength(0);
  });

  it("reasoning the author never sees counts", async () => {
    const types = await chunkTypesOfTurn(() =>
      Promise.resolve({
        stream: new ReadableStream({
          start(controller) {
            controller.enqueue({ type: "stream-start", warnings: [] });
            controller.enqueue({ type: "reasoning-start", id: "r1" });
            controller.enqueue({
              type: "reasoning-delta",
              id: "r1",
              delta: "thinking",
            });
            controller.enqueue({ type: "reasoning-end", id: "r1" });
            controller.enqueue({
              type: "finish",
              finishReason: STOPPED,
              usage,
            });
            controller.close();
          },
        }),
      }),
    );

    expect(types.filter((t) => MODEL_OUTPUT_CHUNK.test(t))).not.toHaveLength(0);
  });

  it("a tool call the model chose counts", async () => {
    let step = 0;
    const types = await chunkTypesOfTurn(() => {
      step += 1;
      return Promise.resolve({
        stream: new ReadableStream({
          start(controller) {
            controller.enqueue({ type: "stream-start", warnings: [] });
            if (step === 1) {
              controller.enqueue({
                type: "tool-call",
                toolCallId: "c1",
                toolName: "insertContent",
                input: JSON.stringify({ value: "x" }),
              });
              controller.enqueue({
                type: "finish",
                finishReason: CALLED_TOOLS,
                usage,
              });
            } else {
              controller.enqueue({
                type: "finish",
                finishReason: STOPPED,
                usage,
              });
            }
            controller.close();
          },
        }),
      });
    });

    expect(types.filter((t) => MODEL_OUTPUT_CHUNK.test(t))).not.toHaveLength(0);
  });

  it("the envelope around a turn that answered nothing counts for nothing", async () => {
    const types = await chunkTypesOfTurn(answeredNothing);

    expect(types).toEqual(["start", "start-step", "finish-step", "finish"]);
    expect(types.filter((t) => MODEL_OUTPUT_CHUNK.test(t))).toEqual([]);
  });

  it("a turn that only errored counts for nothing", async () => {
    const types = await chunkTypesOfTurn(() =>
      Promise.reject(new Error("upstream connect error")),
    );

    expect(types).toEqual(["start", "error"]);
    expect(types.filter((t) => MODEL_OUTPUT_CHUNK.test(t))).toEqual([]);
  });
});
