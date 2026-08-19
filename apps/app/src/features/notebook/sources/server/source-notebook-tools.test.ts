import type { NotebookRuntimeContext } from "@/features/notebook/server";
import type * as SearchSources from "./search-sources";
import type { SearchOutcome, SourceMatch } from "./search-sources";

import { AppError } from "@scibly/api/application-error";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Both source endpoints bound a model in a loop, so their window is a minute.
const counter = await vi.hoisted(async () => {
  const { TimeHelpers } = await import("@scibly/api/rate-limit");
  const { rateLimitCounter } = await import("@test/mocks/rate-limit-counter");
  return rateLimitCounter(TimeHelpers.IN_MS.MINUTE);
});

const db = vi.hoisted(() => ({ rateLimit: counter.model }));

const access = vi.hoisted(() => ({
  assertNotebookOwner: vi.fn(),
  resolveNotebook: vi.fn(),
  resolveNotebookInOrg: vi.fn(),
}));

const sources = vi.hoisted(() => ({
  searchNotebookSources: vi.fn(),
  readNotebookSource: vi.fn(),
}));

vi.mock("@scibly/db", () => ({ db }));
vi.mock("@/features/notebook/workspace/server/access", () => access);
vi.mock("./search-sources", async (importOriginal) => {
  const actual = await importOriginal<typeof SearchSources>();
  return { ...actual, ...sources };
});

// The mocked client, typed as the real one — the caller's context wants a
// `PrismaClient` and only the two rate-limit reads are ever reached.
const { db: prisma } = await import("@scibly/db");
const { createCaller } = await import("@/server/api/root");
const { buildSourceNotebookTools } = await import("./source-notebook-tools");

const USER_ID = "user-1";
const NOTEBOOK_ID = "nb-1";
const RAW_PASSAGE = "Mitochondria make ATP.";

function match(overrides: Partial<SourceMatch> = {}): SourceMatch {
  return {
    content: RAW_PASSAGE,
    offset: 1_200,
    sourceId: "src-1",
    sourceName: "Cell Biology.pdf",
    sourceWarning: null,
    ...overrides,
  };
}

function runtimeContext(
  notebookId: string | undefined,
): NotebookRuntimeContext {
  const now = new Date("2026-01-01T00:00:00Z");
  const session = {
    session: {
      id: "sess-1",
      createdAt: now,
      updatedAt: now,
      userId: USER_ID,
      expiresAt: new Date("2026-12-31T00:00:00Z"),
      token: "token",
    },
    user: {
      id: USER_ID,
      name: "Author",
      email: "author@example.com",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    },
  };

  return {
    caller: createCaller({
      db: prisma,
      headers: new Headers(),
      locale: "en",
      correlationId: "corr-1",
      actor: { userId: USER_ID },
      session,
    }),
    session,
    notebookId,
    orgSlug: "acme",
    dataStream: {
      write: () => undefined,
      merge: () => undefined,
      onError: undefined,
    },
  };
}

type SearchInput = { query: string; limit?: number };
type ReadInput = { sourceId: string; offset?: number };

async function runTool(
  toolName: "searchNotebookSources" | "readSource",
  notebookId: string | undefined,
  input: SearchInput | ReadInput,
) {
  const execute = buildSourceNotebookTools(runtimeContext(notebookId))[toolName]
    .execute;
  if (!execute) throw new Error("The tool has no execute.");
  const result = await execute(input as never, {
    toolCallId: "call-1",
    messages: [],

    context: {},
  });
  if (Symbol.asyncIterator in result) {
    throw new Error("These tools return one result, not a stream.");
  }
  return result;
}

async function search(input: SearchInput) {
  return searchIn(NOTEBOOK_ID, input);
}

async function searchWithNoActiveNotebook(input: SearchInput) {
  return searchIn(undefined, input);
}

async function searchIn(notebookId: string | undefined, input: SearchInput) {
  return runTool("searchNotebookSources", notebookId, input) as Promise<
    Awaited<ReturnType<typeof runTool>> & { results: SourceMatch[] }
  >;
}

async function read(input: ReadInput) {
  return readIn(NOTEBOOK_ID, input);
}

async function readIn(notebookId: string | undefined, input: ReadInput) {
  return runTool("readSource", notebookId, input);
}

type ToolResult = Awaited<ReturnType<typeof runTool>>;

function emptyOutcome(result: ToolResult) {
  if (!("reason" in result) || !("message" in result)) {
    throw new Error(
      `An empty result must carry a reason and a message: ${JSON.stringify(result)}`,
    );
  }
  return result;
}

function outcome(value: SearchOutcome) {
  sources.searchNotebookSources.mockResolvedValue(value);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);

  counter.clear();
  access.resolveNotebook.mockResolvedValue({
    notebook: { id: NOTEBOOK_ID, organizationId: "org-1", userId: USER_ID },
    membership: { role: "owner" },
  });
  outcome({ status: "MATCHED", matches: [match()] });
  sources.readNotebookSource.mockResolvedValue({
    status: "READ",
    passage: `Chars 0–20 of 20. That is the end of the source.\n\n${RAW_PASSAGE}`,
  });
});

describe("the boundary in front of a search", () => {
  it("resolves the notebook for the signed-in user before searching anything", async () => {
    await search({ query: "what is ATP?" });

    expect(access.resolveNotebook).toHaveBeenCalledWith(NOTEBOOK_ID, USER_ID);
    expect(
      access.resolveNotebook.mock.invocationCallOrder[0] ?? 0,
    ).toBeLessThan(
      sources.searchNotebookSources.mock.invocationCallOrder[0] ?? 0,
    );
  });

  it("never reaches the source text for a notebook the caller may not have", async () => {
    access.resolveNotebook.mockRejectedValue(
      new AppError({
        code: "NOT_FOUND",
        applicationCode: "api.not_found",
        message: "Notebook not found.",
      }),
    );

    const result = await search({ query: "what is ATP?" });

    expect(sources.searchNotebookSources).not.toHaveBeenCalled();

    expect(result).toMatchObject({ results: [], reason: "FAILED" });
  });
});

describe("how many passages the model may ask for", () => {
  it.each([
    { case: "asks for nothing in particular", limit: undefined, sent: 5 },
    { case: "asks for fewer", limit: 3, sent: 3 },
    { case: "asks for the maximum", limit: 10, sent: 10 },
    { case: "asks for more than exists", limit: 50, sent: 10 },
  ])("a model that $case searches for $sent", async ({ limit, sent }) => {
    await search({ query: "what is ATP?", limit });

    expect(sources.searchNotebookSources).toHaveBeenCalledWith(
      NOTEBOOK_ID,
      "what is ATP?",
      sent,
    );
  });
});

describe("what a passage looks like to the model", () => {
  it("hands over labelled quoted material, still naming its source", async () => {
    const result = await search({ query: "what is ATP?" });

    const [passage] = result.results;
    expect(passage?.content).toContain('<source-passage sourceId="src-1">');
    expect(passage?.content).toContain(RAW_PASSAGE);
    expect(passage?.sourceId).toBe("src-1");
    expect(passage?.sourceName).toBe("Cell Biology.pdf");
  });

  it("carries the offset the snippet was found at", async () => {
    const result = await search({ query: "what is ATP?" });

    expect(result.results[0]?.offset).toBe(1_200);
  });

  it("carries the truncation notice through to the model", async () => {
    const warning = "This source exceeded indexing limits and was truncated.";
    outcome({
      status: "MATCHED",
      matches: [match({ sourceWarning: warning })],
    });

    const result = await search({ query: "assessment" });

    expect(result.results[0]?.sourceWarning).toBe(warning);
  });

  it("labels only what it hands over — the match itself is untouched", async () => {
    const found = match();
    outcome({ status: "MATCHED", matches: [found] });

    await search({ query: "what is ATP?" });

    expect(found.content).toBe(RAW_PASSAGE);
  });
});

describe("the kinds of nothing", () => {
  it("tells the model the material is still being read, and how much of it", async () => {
    outcome({ status: "NOT_INDEXED", ingestingSources: 3 });

    const result = emptyOutcome(await search({ query: "what is ATP?" }));

    expect(result).toMatchObject({
      results: [],
      reason: "NOT_INDEXED",
      ingestingSources: 3,
    });
    expect(result.message).toMatch(/still being processed/i);
  });

  it("tells the model an empty notebook is empty, not unhelpful", async () => {
    outcome({ status: "NOT_INDEXED", ingestingSources: 0 });

    const result = emptyOutcome(await search({ query: "what is ATP?" }));

    expect(result).toMatchObject({
      results: [],
      reason: "NOT_INDEXED",
      ingestingSources: 0,
    });
    expect(result.message).toMatch(/add a source/i);
  });

  it("distinguishes sources that do not cover the question from having none", async () => {
    outcome({ status: "BELOW_RELEVANCE_FLOOR" });

    const result = emptyOutcome(await search({ query: "mitosis" }));

    expect(result).toMatchObject({
      results: [],
      reason: "BELOW_RELEVANCE_FLOOR",
    });
    expect(result.message).toMatch(/nothing relevant/i);
  });
});

describe("a search that cannot answer", () => {
  it("refuses a search with no notebook without going near the database", async () => {
    const result = emptyOutcome(
      await searchWithNoActiveNotebook({ query: "what is ATP?" }),
    );

    expect(access.resolveNotebook).not.toHaveBeenCalled();
    expect(sources.searchNotebookSources).not.toHaveBeenCalled();
    expect(result).toMatchObject({ reason: "NO_NOTEBOOK", retry: false });
  });

  it("reports a broken search to the model and lets the turn continue", async () => {
    sources.searchNotebookSources.mockRejectedValue(
      new Error("Failed to search notebook sources. Please try again."),
    );

    const result = emptyOutcome(await search({ query: "what is ATP?" }));

    expect(result).toMatchObject({
      results: [],
      reason: "FAILED",
      retry: true,
    });
    expect(result.message).toMatch(/could not read their sources/i);

    expect(result).not.toHaveProperty("error");
  });

  it("tells a rate-limited model to stop searching rather than to try again", async () => {
    counter.setSpent(USER_ID, "source.search", 120);

    const result = emptyOutcome(await search({ query: "what is ATP?" }));

    expect(sources.searchNotebookSources).not.toHaveBeenCalled();
    expect(result).toMatchObject({ reason: "RATE_LIMITED", retry: false });
    expect(result.message).toMatch(
      /continue with the passages you already have/i,
    );
  });

  it("counts a search against the user, not the notebook", async () => {
    await search({ query: "what is ATP?" });

    expect(counter.keys()).toEqual([
      expect.stringContaining(`${USER_ID}|source.search|`),
    ]);
  });
});

describe("paging through one source", () => {
  it("resolves the notebook before reading, and reads within it", async () => {
    await read({ sourceId: "src-1", offset: 50_000 });

    expect(access.resolveNotebook).toHaveBeenCalledWith(NOTEBOOK_ID, USER_ID);
    expect(sources.readNotebookSource).toHaveBeenCalledWith(
      NOTEBOOK_ID,
      "src-1",
      50_000,
    );
  });

  it("starts at the beginning when the model does not say where to start", async () => {
    await read({ sourceId: "src-1" });

    expect(sources.readNotebookSource).toHaveBeenCalledWith(
      NOTEBOOK_ID,
      "src-1",
      0,
    );
  });

  it("cannot be asked to read from before the start of a source", async () => {
    await read({ sourceId: "src-1", offset: -10 });

    expect(sources.readNotebookSource).toHaveBeenCalledWith(
      NOTEBOOK_ID,
      "src-1",
      0,
    );
  });

  it("hands the page back with the text it holds", async () => {
    const result = await read({ sourceId: "src-1" });

    expect(result).toMatchObject({
      content: expect.stringContaining(RAW_PASSAGE),
    });
  });

  it("reports a source outside this notebook as one that is not there", async () => {
    sources.readNotebookSource.mockResolvedValue({ status: "NOT_FOUND" });

    const result = emptyOutcome(await read({ sourceId: "src-elsewhere" }));

    expect(result).toMatchObject({ reason: "NOT_FOUND", retry: false });
    expect(result.message).toMatch(/no such source in this notebook/i);
  });

  it("separates a source with no text yet from one that does not exist", async () => {
    sources.readNotebookSource.mockResolvedValue({ status: "EMPTY" });

    const result = emptyOutcome(await read({ sourceId: "src-1" }));

    expect(result).toMatchObject({ reason: "EMPTY", retry: false });
    expect(result.message).toMatch(/still being imported/i);
  });

  it("refuses a read with no notebook without going near the database", async () => {
    const result = emptyOutcome(await readIn(undefined, { sourceId: "src-1" }));

    expect(access.resolveNotebook).not.toHaveBeenCalled();
    expect(sources.readNotebookSource).not.toHaveBeenCalled();
    expect(result).toMatchObject({ reason: "NO_NOTEBOOK", retry: false });
  });

  it("tells a model paging in a loop to stop rather than to try again", async () => {
    counter.setSpent(USER_ID, "source.read", 120);

    const result = emptyOutcome(await read({ sourceId: "src-1" }));

    expect(sources.readNotebookSource).not.toHaveBeenCalled();
    expect(result).toMatchObject({ reason: "RATE_LIMITED", retry: false });
  });

  it("reports a broken read to the model and lets the turn continue", async () => {
    sources.readNotebookSource.mockRejectedValue(new Error("connection reset"));

    const result = emptyOutcome(await read({ sourceId: "src-1" }));

    expect(result).toMatchObject({ reason: "FAILED", retry: true });
    expect(result.message).toMatch(/continue without it/i);
  });
});
