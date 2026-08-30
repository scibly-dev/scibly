import type { ChatTransport } from "ai";
import type { NotebookMessage } from "@/features/notebook/chat/contracts";

import { createChat } from "@shadcn/helpers/ai-sdk";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useChatInstance } from "./use-chat-instance";

// The route, replaced by a scripted stream. Each test assigns the conversation
// it wants before mounting; the hook builds its transport once, on mount.
let scripted = createChat<NotebookMessage>();
let connectionDrops = false;

vi.mock("./notebook-transport", () => ({
  createNotebookTransport: () => {
    const base = scripted.transport({ delayMs: undefined });
    return connectionDrops ? dropsAfterAnnouncing(base) : base;
  },
}));

function dropsAfterAnnouncing(
  base: ChatTransport<NotebookMessage>,
): ChatTransport<NotebookMessage> {
  return {
    reconnectToStream: (options) => base.reconnectToStream(options),
    sendMessages: async (options) => {
      const reader = (await base.sendMessages(options)).getReader();
      let announced = false;

      return new ReadableStream({
        async pull(controller) {
          if (announced) {
            await new Promise((resolve) => setTimeout(resolve, FOLD_MS));
            return controller.error(new Error("socket hang up"));
          }
          const { done, value } = await reader.read();
          if (done) return controller.error(new Error("socket hang up"));
          announced = value.type === "data-compaction";
          controller.enqueue(value);
        },
      });
    },
  };
}

// One object, not one per render: the hook memoizes its transport on `utils`,
// and a fresh identity every render would rebuild the transport mid-stream.
vi.mock("@/shared/api/trpc/client", () => {
  const noop = () => undefined;
  const utils = {
    notebook: {
      getById: { setData: noop, invalidate: noop },
      getMeta: { setData: noop },
      list: { invalidate: noop },
    },
    billing: { getGenerationBalance: { invalidate: noop } },
  };
  return { api: { useUtils: () => utils } };
});

const ASK = "Outline the course from my sources.";

const FOLD_MS = 300;

const compaction = (data: "summarizing" | "done" | "failed") =>
  ({ type: "data-compaction", data, transient: true }) as const;

const NOTEBOOK = {
  orgSlugRef: { current: "acme" },
  activeNotebookIdRef: { current: "notebook-1" as string | undefined },
  currentModelIdRef: { current: "test-model" },
  setActiveNotebookId: () => undefined,
};

function askAndWatch() {
  const { result } = renderHook(() => useChatInstance(NOTEBOOK));
  act(() => void result.current.sendMessage({ text: ASK }));
  return result;
}

beforeEach(() => {
  scripted = createChat<NotebookMessage>();
  connectionDrops = false;

  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => vi.restoreAllMocks());

describe("what the author is told while the history is folded", () => {
  it("the fold is announced while it is running", async () => {
    scripted.user(ASK).assistant(({ writer }) => {
      writer.data(compaction("summarizing"));
      writer.sleep(FOLD_MS);
      writer.data(compaction("done"));
      writer.text("Start with a lesson on cell structure.");
    });

    const result = askAndWatch();

    await waitFor(() => expect(result.current.isCompacting).toBe(true));
  });

  it("the notice clears when the fold settles, not when the turn ends", async () => {
    scripted.user(ASK).assistant(({ writer }) => {
      writer.data(compaction("summarizing"));
      writer.sleep(FOLD_MS);
      writer.data(compaction("done"));
      writer.sleep(FOLD_MS);
      writer.text("Start with a lesson on cell structure.");
    });

    const result = askAndWatch();
    await waitFor(() => expect(result.current.isCompacting).toBe(true));

    await waitFor(() => {
      expect(result.current.isCompacting).toBe(false);
      expect(result.current.status).toBe("streaming");
    });
  });

  it("a turn that dies mid-fold stops claiming to be folding", async () => {
    connectionDrops = true;
    scripted.user(ASK).assistant(({ writer }) => {
      writer.data(compaction("summarizing"));
      writer.text("Start with a lesson on cell structure.");
    });

    const result = askAndWatch();
    await waitFor(() => expect(result.current.isCompacting).toBe(true));

    await waitFor(() => expect(result.current.error).toBeDefined());
    expect(result.current.isCompacting).toBe(false);
  });

  it("a turn that ends without settling the fold stops claiming to be folding", async () => {
    scripted.user(ASK).assistant(({ writer }) => {
      writer.data(compaction("summarizing"));
      writer.sleep(FOLD_MS);
      writer.text("Start with a lesson on cell structure.");
    });

    const result = askAndWatch();
    await waitFor(() => expect(result.current.isCompacting).toBe(true));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.isCompacting).toBe(false);
  });
});
