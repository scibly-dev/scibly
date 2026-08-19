import type * as DbModule from "@scibly/db";

import { beforeEach, describe, expect, it, vi } from "vitest";

// Authorization is covered separately in notebook.router.test.ts — this only
// asserts the query itself can't reach beyond the given notebook.

const db = vi.hoisted(() => ({
  notebookChat: { findMany: vi.fn() },
}));

vi.mock("@scibly/db", async (importOriginal) => ({
  ...(await importOriginal<typeof DbModule>()),
  db,
}));

const { listOlderNotebookMessages } = await import("./list-older-messages");

const CURSOR = "2026-01-01T00:00:00.000Z|USER|msg-9";

beforeEach(() => {
  vi.clearAllMocks();
  db.notebookChat.findMany.mockResolvedValue([]);
});

describe("paging back through a notebook's conversation", () => {
  it("scopes every page to the notebook it was asked for", async () => {
    await listOlderNotebookMessages("nb-1", CURSOR);

    expect(db.notebookChat.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ notebookId: "nb-1" }),
      }),
    );
  });

  it("the cursor narrows the page within the notebook rather than replacing its scope", async () => {
    await listOlderNotebookMessages(
      "nb-1",
      "2026-01-01T00:00:00.000Z|ASSISTANT|msg-from-another-notebook",
    );

    const where = db.notebookChat.findMany.mock.calls[0]?.[0].where;
    expect(where).toMatchObject({ notebookId: "nb-1" });
    expect(where.OR).toBeDefined();
  });
});
