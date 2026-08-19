import { tool } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  READ_SOURCE_TOOL,
  SEARCH_NOTEBOOK_SOURCES_TOOL,
} from "@/features/notebook/sources/server/source-notebook-tools";
import { type NotebookRuntimeContext } from "@/features/notebook/tools/runtime-context";

import { createNotebookAgent } from "./notebook-agent";

// Nothing here is doubled except the provider — the agent, its tool loop, and the SDK's own tool filtering all run for real.

const stub = (description: string) =>
  tool({
    description,
    inputSchema: z.object({ value: z.string() }),
    execute: async () => "ok",
  });

const TOOLS = {
  [SEARCH_NOTEBOOK_SOURCES_TOOL]: stub("search"),
  [READ_SOURCE_TOOL]: stub("read"),
  insertContent: stub("insert"),
  generateImage: stub("image"),
};

type GenerateFn = Extract<
  NonNullable<
    ConstructorParameters<typeof MockLanguageModelV4>[0]
  >["doGenerate"],
  (...args: never[]) => unknown
>;

// No tool runs here — the provider is only asked what it may call — so a real caller, session, and stream writer would be doubles nothing reads.
const UNREAD_RUNTIME_CONTEXT = {} as NotebookRuntimeContext;

const STOPPED = { unified: "stop", raw: "stop" } as const;
const CALLED_TOOLS = { unified: "tool-calls", raw: "tool_use" } as const;
const USAGE = {
  inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 1, text: 1, reasoning: 0 },
};

async function toolsOfferedToProvider(turn: {
  sourceTier: 1 | 2;
  supportsTools?: boolean;
}): Promise<string[]> {
  const doGenerate: GenerateFn = async () => ({
    content: [{ type: "text", text: "done" }],
    finishReason: STOPPED,
    usage: USAGE,
    warnings: [],
  });
  const model = new MockLanguageModelV4({ doGenerate });

  const agent = createNotebookAgent({
    model,
    instructions: "you are a course designer",
    tools: TOOLS,
    runtimeContext: UNREAD_RUNTIME_CONTEXT,
    supportsTools: turn.supportsTools ?? true,
    sourceTier: turn.sourceTier,
  });

  await agent.generate({ prompt: "write me a lesson" });

  return (model.doGenerateCalls[0]?.tools ?? []).map((t) => t.name);
}

describe("which tools a turn is allowed", () => {
  it("withholds the retrieval tools when every source is already quoted", async () => {
    expect(await toolsOfferedToProvider({ sourceTier: 1 })).toEqual([
      "insertContent",
      "generateImage",
    ]);
  });

  it("offers them when the sources are only described", async () => {
    const offered = await toolsOfferedToProvider({ sourceTier: 2 });
    expect(offered).toContain(SEARCH_NOTEBOOK_SOURCES_TOOL);
    expect(offered).toContain(READ_SOURCE_TOOL);
  });

  it("a model that cannot call tools gets none, reasoning or not", async () => {
    expect(
      await toolsOfferedToProvider({ sourceTier: 2, supportsTools: false }),
    ).toEqual([]);
  });
});

describe("how long a turn may run", () => {
  it("stops a model that never stops calling tools, and keeps its work", async () => {
    let call = 0;
    const doGenerate: GenerateFn = async () => ({
      content: [
        {
          type: "tool-call",
          toolCallId: `call-${(call += 1)}`,
          toolName: "insertContent",
          input: JSON.stringify({ value: "more" }),
        },
      ],
      finishReason: CALLED_TOOLS,
      usage: USAGE,
      warnings: [],
    });
    const model = new MockLanguageModelV4({ doGenerate });

    const agent = createNotebookAgent({
      model,
      instructions: "you are a course designer",
      tools: TOOLS,
      runtimeContext: UNREAD_RUNTIME_CONTEXT,
      supportsTools: true,
      sourceTier: 1,
    });

    const result = await agent.generate({ prompt: "keep going forever" });

    expect(model.doGenerateCalls).toHaveLength(20);
    expect(result.steps).toHaveLength(20);
  });
});
