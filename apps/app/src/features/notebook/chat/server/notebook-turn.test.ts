import type { StreamChatInput } from "./utils/schema";

import { MockLanguageModelV4 } from "ai/test";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GENERATION_CHARGED_ON_FAILURE_NOTICE } from "@/shared/ai/server/generation-settlement";

// A whole turn, from the request to the bytes the author's browser receives, with only the provider doubled — a suite that wrote the provider's answer by hand would just be grading its own homework.

const notebookStore = vi.hoisted(() => ({
  ensureNotebook: vi.fn(),
  UNTITLED_NOTEBOOK: "Untitled Notebook",
}));

const messageStore = vi.hoisted(() => ({
  changedMessages: vi.fn(() => []),
  loadNotebookMessages: vi.fn(),
  persistMessages: vi.fn(),
}));

const models = vi.hoisted(() => ({
  getLanguageModel: vi.fn(),
  getModelCapabilities: vi.fn(),
  resolveContextWindow: vi.fn(() => 128_000),
}));

const context = vi.hoisted(() => ({
  buildSystemPrompt: vi.fn(() => ({
    prompt: "you are a course designer",
    tier: 1,
  })),
}));

// The entitlement seam runs for real over this mocked db, so the rows below
// exercise the actual debit position and refund wiring.
const dbMock = vi.hoisted(() => ({
  notebook: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  course: { findFirst: vi.fn() },
  organizationSubscription: { findUnique: vi.fn() },
  organizationCredit: { updateMany: vi.fn(), findUnique: vi.fn() },
  creditLedgerEntry: { create: vi.fn(), update: vi.fn() },
  $transaction: vi.fn(async (arg: unknown) =>
    typeof arg === "function"
      ? arg(dbMock)
      : Promise.all(arg as Promise<unknown>[]),
  ),
}));

vi.mock("@scibly/db", () => ({ db: dbMock }));
vi.mock("@/features/notebook/server", () => notebookStore);
vi.mock("./messages", () => messageStore);
vi.mock("@/shared/ai/server/models/registry", () => models);
vi.mock("@/features/notebook/tools/registry.server", () => ({
  buildToolRegistry: vi.fn(() => ({})),
}));
vi.mock("@/features/notebook/skills", () => ({
  getNotebookSkills: vi.fn(() => []),
}));
vi.mock("@/server/api/root", () => ({ createCaller: () => ({}) }));
vi.mock("./utils/context", () => context);

const { streamNotebookChat } = await import("./stream-chat");

const AUTHOR = "user-author";
const ORG = "biology-dept";
const ORG_ID = "org-biology";
const NOTEBOOK = "nb-1";

type ProviderSettings = NonNullable<
  ConstructorParameters<typeof MockLanguageModelV4>[0]
>;
type DoStream = Extract<
  ProviderSettings["doStream"],
  (...args: never[]) => unknown
>;
type DoGenerate = Extract<
  ProviderSettings["doGenerate"],
  (...args: never[]) => unknown
>;

const STOPPED = { unified: "stop", raw: "stop" } as const;
const USAGE = {
  inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 1, text: 1, reasoning: 0 },
};

let answersTheTurn: DoStream;
let summarizes: DoGenerate;

const emits = (write: (controller: ReadableStreamDefaultController) => void) =>
  Promise.resolve({
    stream: new ReadableStream({
      start(controller) {
        controller.enqueue({ type: "stream-start", warnings: [] });
        write(controller);
      },
    }),
  });

const ends = (controller: ReadableStreamDefaultController) => {
  controller.enqueue({ type: "finish", finishReason: STOPPED, usage: USAGE });
  controller.close();
};

const emitsThenDrops = (parts: object[]) => {
  const pending = [{ type: "stream-start", warnings: [] }, ...parts];
  return Promise.resolve({
    stream: new ReadableStream({
      pull(controller) {
        const next = pending.shift();
        if (next) controller.enqueue(next);
        else controller.error(new Error("socket hang up"));
      },
    }),
  });
};

const answersWithText: DoStream = () =>
  emits((controller) => {
    controller.enqueue({ type: "text-start", id: "t1" });
    controller.enqueue({
      type: "text-delta",
      id: "t1",
      delta: "Here is an outline.",
    });
    controller.enqueue({ type: "text-end", id: "t1" });
    ends(controller);
  });

function ctx() {
  const now = new Date("2026-01-01T00:00:00Z");
  return {
    db: dbMock as never,
    headers: new Headers(),
    locale: "en" as const,
    correlationId: "corr-1",
    actor: { userId: AUTHOR },
    session: {
      session: {
        id: "sess-1",
        createdAt: now,
        updatedAt: now,
        userId: AUTHOR,
        expiresAt: new Date("2026-12-31T00:00:00Z"),
        token: "token",
      },
      user: {
        id: AUTHOR,
        name: "Author",
        email: "author@example.com",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
    },
  };
}

function stored(id: string, role: "user" | "assistant", body: string) {
  return { id, role, parts: [{ type: "text" as const, text: body }] };
}

type Chunk = { type: string; data?: unknown; errorText?: string };

async function chunksOfTurn(
  input: Partial<StreamChatInput> = {},
): Promise<Chunk[]> {
  const response = await streamNotebookChat(
    {
      orgSlug: ORG,
      notebookId: NOTEBOOK,
      message: stored("ask", "user", "outline the course"),
      ...input,
    },
    ctx(),
  );
  const body = await response.text();
  return body
    .split("\n\n")
    .flatMap((frame) => {
      const payload = frame
        .split("\n")
        .find((line) => line.startsWith("data: "))
        ?.slice("data: ".length);
      return payload && payload !== "[DONE]" ? [JSON.parse(payload)] : [];
    })
    .map((chunk: Chunk) => chunk);
}

async function* framesOfTurn(
  input: Partial<StreamChatInput> = {},
): AsyncGenerator<Chunk> {
  const response = await streamNotebookChat(
    {
      orgSlug: ORG,
      notebookId: NOTEBOOK,
      message: stored("ask", "user", "outline the course"),
      ...input,
    },
    ctx(),
  );
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffered = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return;
    buffered += decoder.decode(value, { stream: true });
    const frames = buffered.split("\n\n");
    buffered = frames.pop() ?? "";
    for (const frame of frames) {
      const payload = frame
        .split("\n")
        .find((line) => line.startsWith("data: "))
        ?.slice("data: ".length);
      if (payload && payload !== "[DONE]") yield JSON.parse(payload) as Chunk;
    }
  }
}

function failureOf(chunks: Chunk[]): string {
  const error = chunks.find((chunk) => chunk.type === "error");
  if (!error) throw new Error("the turn did not fail");
  return error.errorText ?? "";
}

async function expectRefunded() {
  await vi.waitFor(() =>
    expect(dbMock.creditLedgerEntry.update).toHaveBeenCalledWith({
      where: { id: "entry-1" },
      data: { refundedAt: expect.any(Date) },
    }),
  );
  expect(dbMock.organizationCredit.updateMany).toHaveBeenCalledWith({
    where: { organizationId: ORG_ID },
    data: { allowanceRemaining: { increment: 1 } },
  });
}

const provider = () =>
  new MockLanguageModelV4({
    doStream: (...args) => answersTheTurn(...args),
    doGenerate: (...args) => summarizes(...args),
  });

function useOwnEndpoint() {
  dbMock.organizationSubscription.findUnique.mockResolvedValue({
    plan: "BUSINESS",
  });
  models.getLanguageModel.mockImplementation(async () => ({
    id: "byoai:org-model-1",
    model: provider(),
    isByoai: true,
  }));
}

beforeEach(() => {
  vi.clearAllMocks();
  answersTheTurn = answersWithText;
  summarizes = () =>
    Promise.resolve({
      content: [{ type: "text", text: "STATE — one course, two lessons." }],
      finishReason: STOPPED,
      usage: USAGE,
      warnings: [],
    });

  notebookStore.ensureNotebook.mockResolvedValue({
    notebookId: NOTEBOOK,
    organizationId: ORG_ID,
  });
  messageStore.loadNotebookMessages.mockResolvedValue([]);
  dbMock.notebook.findUnique.mockResolvedValue(null);
  dbMock.notebook.update.mockResolvedValue({});
  dbMock.notebook.updateMany.mockResolvedValue({ count: 1 });
  dbMock.course.findFirst.mockResolvedValue({ id: "course-1" });
  dbMock.organizationSubscription.findUnique.mockResolvedValue({
    plan: "STARTER",
  });
  dbMock.organizationCredit.updateMany.mockResolvedValue({ count: 1 });
  dbMock.organizationCredit.findUnique.mockResolvedValue({ id: "credit-1" });
  dbMock.creditLedgerEntry.create.mockResolvedValue({ id: "entry-1" });
  dbMock.creditLedgerEntry.update.mockResolvedValue({ id: "entry-1" });
  models.getLanguageModel.mockImplementation(async () => ({
    id: "scibly/default",
    model: provider(),
    isByoai: false,
  }));
  models.getModelCapabilities.mockResolvedValue({
    tools: true,
    vision: false,
    reasoning: false,
  });
  models.resolveContextWindow.mockReturnValue(128_000);
});

describe("what a turn that broke mid-flight costs", () => {
  it("an answer cut off after it started is still charged, and the author is told", async () => {
    answersTheTurn = () =>
      emits((controller) => {
        controller.enqueue({ type: "text-start", id: "t1" });
        controller.enqueue({ type: "text-delta", id: "t1", delta: "Here is " });
        controller.enqueue({
          type: "error",
          error: new Error("the provider gave up mid-sentence"),
        });
        controller.enqueue({
          type: "finish",
          finishReason: { unified: "error", raw: "error" },
          usage: USAGE,
        });
        controller.close();
      });

    const chunks = await chunksOfTurn();

    expect(chunks.map((chunk) => chunk.type)).toEqual([
      "start",
      "start-step",
      "text-start",
      "text-delta",
      "error",
      "finish-step",
      "finish",
    ]);
    expect(failureOf(chunks)).toContain(GENERATION_CHARGED_ON_FAILURE_NOTICE);
    expect(dbMock.creditLedgerEntry.update).not.toHaveBeenCalled();
  });

  it("an answer cut off by the connection dropping is charged the same", async () => {
    answersTheTurn = () =>
      emitsThenDrops([
        { type: "text-start", id: "t1" },
        { type: "text-delta", id: "t1", delta: "Here is " },
      ]);

    const chunks = await chunksOfTurn();

    expect(chunks.map((chunk) => chunk.type)).toEqual([
      "start",
      "start-step",
      "text-start",
      "text-delta",
      "error",
    ]);
    expect(failureOf(chunks)).toContain(GENERATION_CHARGED_ON_FAILURE_NOTICE);
    expect(dbMock.creditLedgerEntry.update).not.toHaveBeenCalled();
  });

  it("a turn the provider never answered is refunded, and no charge is mentioned", async () => {
    answersTheTurn = () => Promise.reject(new Error("upstream connect error"));

    const chunks = await chunksOfTurn();

    expect(failureOf(chunks)).not.toContain(
      GENERATION_CHARGED_ON_FAILURE_NOTICE,
    );
    await expectRefunded();
  });

  it("a turn on the organization's own endpoint is told no such thing", async () => {
    useOwnEndpoint();
    answersTheTurn = () =>
      Promise.reject(new Error("their endpoint timed out"));

    const chunks = await chunksOfTurn();

    expect(failureOf(chunks)).not.toContain(
      GENERATION_CHARGED_ON_FAILURE_NOTICE,
    );
    expect(dbMock.creditLedgerEntry.create).not.toHaveBeenCalled();
    expect(dbMock.creditLedgerEntry.update).not.toHaveBeenCalled();
  });
});

describe("what the author is told while the conversation is folded", () => {
  const WINDOW = 1_000;

  const longConversation = () =>
    Array.from({ length: 12 }, (_, i) =>
      stored(`m${i + 1}`, i % 2 ? "assistant" : "user", "x".repeat(400)),
    );

  beforeEach(() => {
    models.resolveContextWindow.mockReturnValue(WINDOW);
    messageStore.loadNotebookMessages.mockResolvedValue(longConversation());
  });

  const timeline = (chunks: Chunk[]) =>
    chunks
      .filter(
        (chunk) =>
          chunk.type === "data-compaction" || chunk.type === "text-end",
      )
      .map((chunk) =>
        chunk.type === "data-compaction"
          ? `compaction:${chunk.data}`
          : "answer",
      );

  it("the fold is announced before the answer and settled before it too", async () => {
    expect(timeline(await chunksOfTurn())).toEqual([
      "compaction:summarizing",
      "compaction:done",
      "answer",
    ]);
  });

  it("the notice reaches the author while the fold is still running", async () => {
    let foldDone = () => undefined as void;
    const released = new Promise<void>((resolve) => {
      foldDone = () => resolve();
    });
    summarizes = async () => {
      await released;
      return {
        content: [{ type: "text", text: "STATE — one course, two lessons." }],
        finishReason: STOPPED,
        usage: USAGE,
        warnings: [],
      };
    };

    const announced: unknown[] = [];
    for await (const chunk of framesOfTurn()) {
      if (chunk.type !== "data-compaction") continue;
      announced.push(chunk.data);
      if (chunk.data === "summarizing") foldDone();
    }

    expect(announced).toEqual(["summarizing", "done"]);
  });

  it("the announcement is live only — it never lands in the transcript", async () => {
    const chunks = await chunksOfTurn();

    for (const chunk of chunks.filter((c) => c.type === "data-compaction")) {
      expect(chunk).toMatchObject({ transient: true });
    }
  });

  it("a fold that fails still answers the turn, and still charges for it", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    summarizes = () => Promise.reject(new Error("summarizer is down"));

    const chunks = await chunksOfTurn();

    expect(timeline(chunks)).toEqual([
      "compaction:summarizing",
      "compaction:failed",
      "answer",
    ]);
    expect(chunks.some((chunk) => chunk.type === "error")).toBe(false);

    expect(dbMock.notebook.updateMany).not.toHaveBeenCalled();
    expect(dbMock.creditLedgerEntry.update).not.toHaveBeenCalled();
  });

  it("a conversation that still fits is folded silently, because it is not folded", async () => {
    messageStore.loadNotebookMessages.mockResolvedValue([
      stored("m1", "user", "outline the course"),
    ]);

    expect(timeline(await chunksOfTurn())).toEqual(["answer"]);
  });
});
