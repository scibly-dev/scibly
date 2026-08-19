import type * as DbModule from "@scibly/db";
import type { Prisma } from "@scibly/db/client";

import { AppError } from "@scibly/api/application-error";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The plan catalogue is real, not mocked — the point of the cap is which
// number the plan says.
const db = vi.hoisted(() => ({
  organization: { findUnique: vi.fn() },
  organizationSubscription: { findUnique: vi.fn() },
  notebookSource: {
    count: vi.fn(),
    create: vi.fn(),
    createManyAndReturn: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn(),
  },
  organizationCredit: { updateMany: vi.fn(), findUnique: vi.fn() },
  creditLedgerEntry: { create: vi.fn(), update: vi.fn() },
  $executeRaw: vi.fn(),
  $transaction: vi.fn(),
}));

const ingestion = vi.hoisted(() => ({ ingestOrRefreshSource: vi.fn() }));
const invalidation = vi.hoisted(() => ({
  flagScenesForSourceRemoval: vi.fn(),
}));

vi.mock("@scibly/db", async (importOriginal) => ({
  ...(await importOriginal<typeof DbModule>()),
  db,
}));
vi.mock("../ingestion/ingest-source", () => ingestion);
vi.mock("./source-invalidation", () => invalidation);

const {
  addTextSource,
  createPendingSourceUpload,
  deleteNotebookSource,
  linkNotebookPages,
} = await import("./sources");
const { assertAllowed, decideNotebookSourceCap } =
  await import("@scibly/api/entitlement");

const capDb = db as unknown as Prisma.TransactionClient;

const ORG = "org-a";
const NOTEBOOK = "nb-1";
const AUTHOR = "user-author";

async function checkCapacity(requestedCount = 1) {
  assertAllowed(
    await decideNotebookSourceCap(capDb, ORG, {
      notebookId: NOTEBOOK,
      requestedCount,
    }),
  );
  return "written";
}

async function refusal(call: () => Promise<unknown>) {
  try {
    await call();
  } catch (error) {
    if (error instanceof AppError) return error;
    throw error;
  }
  throw new Error("expected the write to be refused, but it resolved");
}

function onPlan(plan: string | null) {
  db.organizationSubscription.findUnique.mockResolvedValue(
    plan === null ? null : { plan, purchasedLearnerSeats: 0 },
  );
}

function holding(count: number) {
  db.notebookSource.count.mockResolvedValue(count);
}

function withCredits(allowanceRemaining: number, topupRemaining = 0) {
  db.organizationCredit.findUnique.mockResolvedValue({
    allowanceRemaining,
    topupRemaining,
  });
}

function addText() {
  return addTextSource({
    notebookId: NOTEBOOK,
    organizationId: ORG,
    name: "Chapter 4",
    content: "Mitochondria make ATP.",
    actorId: AUTHOR,
  });
}

function linkPages(pages: { id: string; title: string; url: string }[]) {
  db.$transaction.mockImplementation(
    (run: (tx: typeof db) => Promise<unknown>) => run(db),
  );
  db.notebookSource.findMany.mockResolvedValue([]);
  db.notebookSource.createManyAndReturn.mockImplementation(
    ({ data }: { data: unknown[] }) =>
      data.map((_row, index) => ({ id: `src-${index + 1}` })),
  );

  return linkNotebookPages({
    notebookId: NOTEBOOK,
    organizationId: ORG,
    actorId: AUTHOR,
    provider: "NOTION",
    connectionId: "conn-1",
    pages,
  });
}

beforeEach(() => {
  vi.resetAllMocks();

  onPlan("STARTER");
  holding(0);
  db.notebookSource.create.mockResolvedValue({ id: "src-new" });

  db.organization.findUnique.mockResolvedValue({ defaultChatModelId: null });
  ingestion.ingestOrRefreshSource.mockResolvedValue({ success: true });
  withCredits(100);
});

describe("the cap is the plan's own number, read at enforcement time", () => {
  it("refuses the 11th source on STARTER", async () => {
    holding(10);

    const error = await refusal(() => checkCapacity());

    expect(error.code).toBe("PAYMENT_REQUIRED");
  });

  it("permits that same 11th source on BUSINESS, which buys 50", async () => {
    onPlan("BUSINESS");
    holding(10);

    await expect(checkCapacity()).resolves.toBe("written");
  });

  it("permits the 100th source on PRO and refuses the 101st", async () => {
    onPlan("PRO");
    holding(99);
    await expect(checkCapacity()).resolves.toBe("written");

    holding(100);
    expect((await refusal(() => checkCapacity())).code).toBe(
      "PAYMENT_REQUIRED",
    );
  });

  it("resolves the organization's subscription on every check, never a cached or copied limit", async () => {
    await checkCapacity();

    expect(db.organizationSubscription.findUnique).toHaveBeenCalledWith({
      where: { organizationId: ORG },
      select: {
        plan: true,
        purchasedLearnerSeats: true,
        status: true,
        pastDueSince: true,
        currentPeriodStart: true,
      },
    });
  });
});

describe("what occupies a slot", () => {
  it("counts every source row in the notebook, whatever its status", async () => {
    await checkCapacity();

    expect(db.notebookSource.count).toHaveBeenCalledWith({
      where: { notebookId: NOTEBOOK },
    });
  });

  it("counts only this notebook's sources", async () => {
    await checkCapacity();

    const [[query]] = db.notebookSource.count.mock.calls;
    expect(Object.keys(query.where)).toEqual(["notebookId"]);
  });
});

describe("deleting a source frees its slot", () => {
  it("reads the count live, so the notebook that was full has room after a delete", async () => {
    holding(10);
    await refusal(() => checkCapacity());

    await deleteNotebookSource("src-old", null);
    holding(9);

    await expect(checkCapacity()).resolves.toBe("written");
    expect(db.notebookSource.delete).toHaveBeenCalledWith({
      where: { id: "src-old" },
    });
  });

  it("re-adding what was deleted is a new source, ingested and charged again", async () => {
    holding(9);

    await addText();

    expect(ingestion.ingestOrRefreshSource).toHaveBeenCalledWith("src-new", {
      actorId: AUTHOR,
    });
  });
});

describe("the boundary belongs to the customer", () => {
  it("permits the source that exactly fills the cap", async () => {
    holding(9);

    await expect(checkCapacity()).resolves.toBe("written");
  });

  it("permits a batch that exactly fills the cap", async () => {
    holding(6);

    await expect(checkCapacity(4)).resolves.toBe("written");
  });
});

describe("a batch is all-or-nothing, and the refusal says by how much", () => {
  it("refuses the whole batch and names the shortfall", async () => {
    holding(8);
    const write = vi.fn(async () => "never");

    const error = await refusal(async () => {
      assertAllowed(
        await decideNotebookSourceCap(capDb, ORG, {
          notebookId: NOTEBOOK,
          requestedCount: 5,
        }),
      );
      return write();
    });

    expect(error.code).toBe("PAYMENT_REQUIRED");
    expect(error.applicationCode).toBe("entitlement.source_cap_exhausted");
    expect(error.details).toEqual({ shortfall: 3, remainingSources: 2 });
    expect(error.message).toContain("3");
    expect(write).not.toHaveBeenCalled();
  });
});

describe("fail closed, no bypass", () => {
  it("an organization with no subscription is refused, not offered an upgrade", async () => {
    onPlan(null);

    const error = await refusal(() => checkCapacity());

    expect(error.applicationCode).toBe("entitlement.unresolvable");
  });

  it("the internal plan traverses the same reads, and its cap is simply unreachable", async () => {
    onPlan("INTERNAL");
    holding(100_000);

    await expect(checkCapacity()).resolves.toBe("written");
    expect(db.organizationSubscription.findUnique).toHaveBeenCalledTimes(1);
    expect(db.notebookSource.count).toHaveBeenCalledTimes(1);
  });

  it("a permitted check spends no generation and writes no ledger entry", async () => {
    await checkCapacity();

    expect(db.organizationCredit.updateMany).not.toHaveBeenCalled();
    expect(db.creditLedgerEntry.create).not.toHaveBeenCalled();
  });
});

describe("the check guards every path that creates a source row", () => {
  it("a full notebook takes no pasted-text source, and starts no ingest", async () => {
    holding(10);

    const error = await refusal(addText);

    expect(error.applicationCode).toBe("entitlement.source_cap_exhausted");
    expect(db.notebookSource.create).not.toHaveBeenCalled();
    expect(ingestion.ingestOrRefreshSource).not.toHaveBeenCalled();
  });

  it("a full notebook reserves no upload row, so the file is never presigned for", async () => {
    holding(10);

    const error = await refusal(() =>
      createPendingSourceUpload({
        notebookId: NOTEBOOK,
        organizationId: ORG,
        actorId: AUTHOR,
        name: "Handbook.pdf",
        type: "PDF",
        fileSize: 1024,
      }),
    );

    expect(error.applicationCode).toBe("entitlement.source_cap_exhausted");
    expect(db.notebookSource.create).not.toHaveBeenCalled();
  });

  it("a page named twice in one batch is linked once, ingested once, and counted once", async () => {
    const page = {
      id: "notion-page-1",
      title: "Cell Biology",
      url: "https://notion.example/cell-biology",
    };

    const result = await linkPages([page, page]);

    expect(result.sourceIds).toEqual(["src-1"]);
    expect(result.skipped).toBe(1);
    expect(
      db.notebookSource.createManyAndReturn.mock.calls[0]?.[0].data,
    ).toHaveLength(1);
    expect(ingestion.ingestOrRefreshSource).toHaveBeenCalledTimes(1);
  });

  it("under the cap, the source is created and handed to the ingest", async () => {
    holding(3);

    const result = await addText();

    expect(db.notebookSource.create).toHaveBeenCalledTimes(1);
    expect(result.sourceId).toBe("src-new");
  });
});

// The same seam as the row-creation check above: whichever of the two
// questions refuses, the row is never written.
describe("the same paths refuse a source they could not index", () => {
  it("an empty balance takes no pasted-text source, and starts no ingest", async () => {
    withCredits(0);

    const error = await refusal(addText);

    expect(error.code).toBe("PAYMENT_REQUIRED");
    expect(error.applicationCode).toBe("entitlement.credits_exhausted");
    expect(db.notebookSource.create).not.toHaveBeenCalled();
    expect(ingestion.ingestOrRefreshSource).not.toHaveBeenCalled();
  });

  it("an empty balance reserves no upload row, so the file is never presigned for", async () => {
    withCredits(0);

    const error = await refusal(() =>
      createPendingSourceUpload({
        notebookId: NOTEBOOK,
        organizationId: ORG,
        actorId: AUTHOR,
        name: "Handbook.pdf",
        type: "PDF",
        fileSize: 1024,
      }),
    );

    expect(error.applicationCode).toBe("entitlement.credits_exhausted");
    expect(db.notebookSource.create).not.toHaveBeenCalled();
  });

  it("a top-up pays for it when the allowance cannot", async () => {
    withCredits(0, 5);

    await expect(addText()).resolves.toMatchObject({ sourceId: "src-new" });
  });

  it("the cap answers first: a notebook that is both full and unfunded says it is full", async () => {
    holding(10);
    withCredits(0);

    const error = await refusal(addText);

    expect(error.applicationCode).toBe("entitlement.source_cap_exhausted");
  });

  it("an organization on the BYOAI plan without a chat model of its own still pays, because the digest runs on ours", async () => {
    onPlan("BUSINESS");
    withCredits(0);

    const error = await refusal(addText);

    expect(error.applicationCode).toBe("entitlement.credits_exhausted");
  });

  it("nothing is charged by the check itself", async () => {
    await addText();

    expect(db.organizationCredit.updateMany).not.toHaveBeenCalled();
    expect(db.creditLedgerEntry.create).not.toHaveBeenCalled();
  });
});
