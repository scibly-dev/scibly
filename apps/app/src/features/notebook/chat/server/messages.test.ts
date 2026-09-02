import type * as DbModule from "@scibly/db";
import type { ChatRole } from "@scibly/db/enums";
import type { NotebookMessage } from "@/features/notebook/chat/contracts";

import { beforeEach, describe, expect, it, vi } from "vitest";

// Characterizes what the notebook ends up storing across a turn, so a change to *how* the pipeline works can be checked against *what* it leaves behind.

type Part = NotebookMessage["parts"][number];

type Row = {
  id: string;
  notebookId: string;
  role: ChatRole;
  parts: Part[];
  createdAt: Date;
};

const table = vi.hoisted(() => ({ rows: [] as Row[] }));

const db = vi.hoisted(() => ({
  notebookChat: {
    findFirst: vi.fn(
      ({ where }: { where: { id: string; notebookId: string } }) =>
        Promise.resolve(
          table.rows.find(
            (row) => row.id === where.id && row.notebookId === where.notebookId,
          ) ?? null,
        ),
    ),
    findMany: vi.fn(
      ({
        where,
      }: {
        where: { notebookId?: string; id?: { in: string[] }; OR?: unknown[] };
      }) => {
        const wanted = where.id?.in;
        return Promise.resolve(
          table.rows.filter((row) =>
            wanted
              ? wanted.includes(row.id)
              : row.notebookId === where.notebookId,
          ),
        );
      },
    ),

    upsert: vi.fn(
      ({
        where,
        create,
        update,
      }: {
        where: { id: string };
        create: Row;
        update: { parts: Part[] };
      }) => {
        const existing = table.rows.find((row) => row.id === where.id);
        if (existing) existing.parts = update.parts;
        else table.rows.push({ ...create });
        return Promise.resolve();
      },
    ),
  },
  $transaction: vi.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
}));

vi.mock("@scibly/db", async (importOriginal) => ({
  ...(await importOriginal<typeof DbModule>()),
  db,
}));

const { changedMessages, loadNotebookMessages, persistMessages } =
  await import("./messages");
const {
  appendAuthorMessage,
  awaitsClientResponse,
  mergeClientMessagesOntoDbHistory,
} = await import("./utils/client-message-merge");

const NOTEBOOK = "nb-1";

function text(value: string): Part {
  return { type: "text", text: value };
}

function approvalRequested(): Part {
  return {
    type: "tool-deleteLessons",
    toolCallId: "call-delete",
    state: "approval-requested",
    input: { courseId: "course-1", lessonIds: ["lesson-1"] },
    approval: { id: "approval-1" },
  };
}

function approvalAnswered(): Part {
  return {
    type: "tool-deleteLessons",
    toolCallId: "call-delete",
    state: "output-available",
    input: { courseId: "course-1", lessonIds: ["lesson-1"] },
    approval: { id: "approval-1", approved: true },
    output: {
      success: true,
      courseId: "course-1",
      deletedLessonIds: [],
      deletedLessons: [],
    },
  };
}

function interruptedServerCall(): Part {
  return {
    type: "tool-searchNotebookSources",
    toolCallId: "call-search",
    state: "input-available",
    input: { query: "atp" },
  };
}

function seed(id: string, role: ChatRole, parts: Part[], minute: number) {
  table.rows.push({
    id,
    notebookId: NOTEBOOK,
    role,
    parts,
    createdAt: new Date(`2026-01-01T00:${String(minute).padStart(2, "0")}:00Z`),
  });
}

function partsOf(id: string) {
  return table.rows.find((row) => row.id === id)?.parts;
}

async function runTurn(options: {
  after?: string;
  incoming?: NotebookMessage;
  fromClient?: NotebookMessage[];
  reply?: NotebookMessage;
}) {
  const dbMessages = await loadNotebookMessages(NOTEBOOK, options.after);
  const continuation =
    Boolean(options.fromClient) && awaitsClientResponse(dbMessages);
  const merged =
    continuation && options.fromClient
      ? mergeClientMessagesOntoDbHistory(dbMessages, options.fromClient)
      : appendAuthorMessage(dbMessages, options.incoming);

  const finished = options.reply ? [...merged, options.reply] : merged;
  await persistMessages({
    notebookId: NOTEBOOK,
    messages: changedMessages(dbMessages, finished),
  });
  return { continuation, dbMessages, finished };
}

beforeEach(() => {
  vi.clearAllMocks();
  table.rows = [];
});

describe("what a turn leaves in the notebook's conversation", () => {
  it("an ordinary turn adds the author's message and the reply, and leaves the history it read exactly as it found it", async () => {
    seed("m1", "USER", [text("outline the course")], 0);
    seed("m2", "ASSISTANT", [text("Here is an outline.")], 1);

    await runTurn({
      incoming: { id: "m3", role: "user", parts: [text("add a quiz")] },
      reply: { id: "m4", role: "assistant", parts: [text("Quiz added.")] },
    });

    expect(table.rows.map((row) => row.id)).toEqual(["m1", "m2", "m3", "m4"]);
    expect(partsOf("m1")).toEqual([text("outline the course")]);
    expect(partsOf("m2")).toEqual([text("Here is an outline.")]);
    expect(partsOf("m3")).toEqual([text("add a quiz")]);
    expect(partsOf("m4")).toEqual([text("Quiz added.")]);
  });

  it("a continuation writes the browser's answer into the assistant row that asked for it, adding no row of its own", async () => {
    seed("m1", "USER", [text("drop lesson one")], 0);
    seed("m2", "ASSISTANT", [text("May I?"), approvalRequested()], 1);

    const { continuation } = await runTurn({
      fromClient: [
        { id: "m2", role: "assistant", parts: [approvalAnswered()] },
      ],
      reply: { id: "m3", role: "assistant", parts: [text("Done.")] },
    });

    expect(continuation).toBe(true);
    expect(table.rows.map((row) => row.id)).toEqual(["m1", "m2", "m3"]);
    expect(partsOf("m2")).toEqual([text("May I?"), approvalAnswered()]);
  });

  it("a server call the stream never got a result for is stored as an error, not as a call still waiting", async () => {
    seed("m1", "USER", [text("what is atp?")], 0);

    await runTurn({
      reply: {
        id: "m2",
        role: "assistant",
        parts: [text("Looking it up."), interruptedServerCall()],
      },
    });

    expect(partsOf("m2")).toEqual([
      text("Looking it up."),
      expect.objectContaining({
        toolCallId: "call-search",
        state: "output-error",
        errorText: "The tool call was interrupted before it returned.",
      }),
    ]);
  });

  it("an unanswered call already sitting in an old row is dropped by the read, so no later turn can carry it back into the model's history", async () => {
    seed("m1", "USER", [text("what is atp?")], 0);
    seed(
      "m2",
      "ASSISTANT",
      [text("Looking it up."), interruptedServerCall()],
      1,
    );

    const { finished } = await runTurn({
      incoming: { id: "m3", role: "user", parts: [text("never mind")] },
    });

    expect(finished.find((message) => message.id === "m2")?.parts).toEqual([
      text("Looking it up."),
    ]);

    expect(partsOf("m2")).toEqual([
      text("Looking it up."),
      interruptedServerCall(),
    ]);
  });

  it("asks only for the messages a summary does not already stand for", async () => {
    seed("m1", "USER", [text("start the course")], 0);
    seed("m2", "ASSISTANT", [text("Started.")], 1);
    seed("m3", "USER", [text("add a quiz")], 2);

    await runTurn({ after: "m2" });

    const where = db.notebookChat.findMany.mock.calls[0]?.[0].where;
    expect(where).toMatchObject({ notebookId: NOTEBOOK });
    expect(where?.OR).toBeDefined();
  });

  it("reads the whole conversation when no row answers to the covered id", async () => {
    seed("m1", "USER", [text("start the course")], 0);
    seed("m2", "ASSISTANT", [text("Started.")], 1);

    const { dbMessages } = await runTurn({ after: "deleted-long-ago" });

    expect(
      db.notebookChat.findMany.mock.calls[0]?.[0].where?.OR,
    ).toBeUndefined();
    expect(dbMessages.map((message) => message.id)).toEqual(["m1", "m2"]);
  });

  it("writes only the rows the turn moved", async () => {
    seed("m1", "USER", [text("start the course")], 0);
    seed("m2", "ASSISTANT", [text("Started.")], 1);

    await runTurn({
      incoming: { id: "m3", role: "user", parts: [text("add a quiz")] },
      reply: { id: "m4", role: "assistant", parts: [text("Quiz added.")] },
    });

    expect(
      db.notebookChat.upsert.mock.calls.map(([call]) => call.where.id),
    ).toEqual(["m3", "m4"]);
  });

  it("refuses the whole write when an incoming id belongs to another notebook", async () => {
    table.rows.push({
      id: "m9",
      notebookId: "nb-other",
      role: "USER",
      parts: [text("someone else's message")],
      createdAt: new Date("2026-01-01T00:00:00Z"),
    });

    await expect(
      persistMessages({
        notebookId: NOTEBOOK,
        messages: [{ id: "m9", role: "user", parts: [text("overwrite me")] }],
      }),
    ).rejects.toThrow("Message does not belong to this notebook.");

    expect(partsOf("m9")).toEqual([text("someone else's message")]);
  });
});
