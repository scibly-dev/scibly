import type { Prisma } from "@scibly/db";
import type { SourceExtractor } from "./extractors";
import type { IngestOptions } from "./ingest-source";

import { AppError } from "@scibly/api/application-error";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  SOURCE_STATUS,
  SOURCE_TYPES,
  type SourceStatus,
  type SourceType,
} from "@/shared/content/sources/constants";
import { transactionsRun } from "@/shared/testing/prisma-transaction";

const db = vi.hoisted(() => ({
  notebookSource: {
    updateMany: vi.fn(),
    findUniqueOrThrow: vi.fn(),
  },
  sceneSourceLineage: { findFirst: vi.fn() },
  organization: { findUnique: vi.fn() },
  $transaction: vi.fn(),
}));

const tx = vi.hoisted(() => ({
  notebookSource: { updateMany: vi.fn() },
  scene: { updateMany: vi.fn() },
}));

const extractors = vi.hoisted(() => ({ getSourceExtractor: vi.fn() }));
// The digest's own contract — lenient parsing, failures swallowed — is proven
// in source-digest.test.ts; here it only has to be a call that returns a digest.
const digest = vi.hoisted(() => ({ generateSourceDigest: vi.fn() }));
const entitlement = vi.hoisted(() => ({
  chargeAiGeneration: vi.fn(),
  decideOwnEndpointGeneration: vi.fn(),
  assertAllowed: vi.fn(
    (decision: {
      refusal: {
        applicationCode: string;
        message: string;
        details?: unknown;
      } | null;
    }) => {
      if (decision.refusal) {
        throw new AppError({ code: "PAYMENT_REQUIRED", ...decision.refusal });
      }
    },
  ),
}));

vi.mock("@scibly/db", () => ({ db }));
vi.mock("./extractors", () => extractors);
vi.mock("./source-digest", () => digest);
vi.mock("@scibly/api/entitlement", () => entitlement);

const { ingestOrRefreshSource } = await import("./ingest-source");
const { computeContentHash } = await import("./content-hash");

const ingest = (options: Partial<IngestOptions> = {}) =>
  ingestOrRefreshSource(SOURCE_ID, { actorId: null, ...options });

const SOURCE_ID = "src-1";
const ORG_ID = "org-1";
const ORG_SLUG = "acme";
const SCENE_ID = "scene-1";

let claimWon = true;
let claimStillOurs = true;

function isFencedWrite(where: Prisma.NotebookSourceWhereInput): boolean {
  return (
    where.status === SOURCE_STATUS.PROCESSING &&
    typeof where.processingToken === "string"
  );
}

function updateManyResult({
  where,
}: {
  where: Prisma.NotebookSourceWhereInput;
}) {
  const wins = isFencedWrite(where) ? claimStillOurs : claimWon;
  return Promise.resolve({ count: wins ? 1 : 0 });
}

interface SourceRowOverrides {
  status?: SourceStatus;
  type?: SourceType;
  contentHash?: string | null;
  externalId?: string | null;
  lastSyncedAt?: Date | null;
  tokenCount?: number;
}

function sourceRow(overrides: SourceRowOverrides = {}) {
  const ingested = overrides.status === SOURCE_STATUS.READY;
  return {
    id: SOURCE_ID,
    name: "Cell Biology.pdf",
    type: SOURCE_TYPES.PDF,
    status: SOURCE_STATUS.PENDING,
    content: null,
    contentHash: null,
    tokenCount: ingested ? 6 : 0,
    summary: ingested ? "Was die Quelle abdeckt." : null,
    outline: ingested ? "- Kapitel 1" : null,
    warning: null,
    error: null,
    pageCount: null,
    externalId: null,
    lastSyncedAt: null,
    processingStartedAt: null,
    processingToken: null,
    notebookId: "nb-1",
    notebook: { organizationId: ORG_ID, organization: { slug: ORG_SLUG } },
    ...overrides,
  };
}

function fakeExtractor(options: { isIntegration?: boolean } = {}) {
  const extract = vi.fn().mockResolvedValue({ text: "" });
  const getRevision = vi.fn().mockResolvedValue(null);
  const extractor: SourceExtractor = {
    isIntegration: options.isIntegration ?? false,
    extract,
    getRevision,
  };
  extractors.getSourceExtractor.mockReturnValue(extractor);
  return { extract, getRevision };
}

function fencedWrites() {
  return [db.notebookSource.updateMany, tx.notebookSource.updateMany]
    .flatMap((mock) =>
      mock.mock.calls.map(([args], index) => ({
        args,
        order: mock.mock.invocationCallOrder[index] ?? 0,
      })),
    )
    .sort((a, b) => a.order - b.order)
    .map((entry) => entry.args)
    .filter((args) => isFencedWrite(args.where));
}

function mintedToken(): unknown {
  return db.notebookSource.updateMany.mock.calls[0]?.[0]?.data?.processingToken;
}

function callOrder(mock: { mock: { invocationCallOrder: number[] } }): number {
  return mock.mock.invocationCallOrder[0] ?? Number.MAX_SAFE_INTEGER;
}

let balance = 100;

// Stands in for `chargeAiGeneration`, keeping the properties this file
// depends on: refusing when the balance is empty, refunding on a throw, and
// handing the operation a refund handle for a failure that isn't one.
function fakeCharge(
  context: { organizationId: string },
  operation: (charge: { refund: () => Promise<void> }) => Promise<unknown>,
) {
  if (balance < 1) {
    return Promise.reject(
      new AppError({
        code: "PAYMENT_REQUIRED",
        applicationCode: "entitlement.credits_exhausted",
        message: "The organization has no AI generations left.",
      }),
    );
  }
  balance -= 1;

  let returned = false;
  const refund = async () => {
    if (returned) return;
    returned = true;
    balance += 1;
  };
  return operation({ refund }).catch((error) => {
    void refund();
    throw error;
  });
}

function charges() {
  return entitlement.chargeAiGeneration.mock.calls.map(([context]) => context);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);

  claimWon = true;
  claimStillOurs = true;

  db.notebookSource.updateMany.mockImplementation(updateManyResult);
  tx.notebookSource.updateMany.mockImplementation(updateManyResult);
  db.notebookSource.findUniqueOrThrow.mockResolvedValue(sourceRow());
  db.sceneSourceLineage.findFirst.mockResolvedValue(null);

  db.organization.findUnique.mockResolvedValue({ defaultChatModelId: null });
  entitlement.decideOwnEndpointGeneration.mockResolvedValue({ refusal: null });
  digest.generateSourceDigest.mockResolvedValue({
    summary: "Was die Quelle abdeckt.",
    outline: "- Kapitel 1",
    produced: true,
  });
  transactionsRun(db, tx);

  tx.scene.updateMany.mockResolvedValue({ count: 0 });

  balance = 100;
  entitlement.chargeAiGeneration.mockImplementation(fakeCharge);

  fakeExtractor().extract.mockResolvedValue({ text: "Mitochondria." });
});

describe("a successful run", () => {
  beforeEach(() => {
    fakeExtractor().extract.mockResolvedValue({
      text: "Mitochondria make ATP.",
      pageCount: 3,
    });
  });

  it("leaves the source READY, holding the hash of what it just extracted", async () => {
    const result = await ingest();

    expect(result).toEqual({
      sourceId: SOURCE_ID,
      status: SOURCE_STATUS.READY,
      success: true,
      previousHash: null,
      newHash: computeContentHash("Mitochondria make ATP."),
      hashChanged: false,
    });
    expect(fencedWrites().at(-1)).toMatchObject({
      data: {
        status: SOURCE_STATUS.READY,
        contentHash: computeContentHash("Mitochondria make ATP."),
        content: "Mitochondria make ATP.",
        pageCount: 3,
        error: null,
        warning: null,

        processingStartedAt: null,
        processingToken: null,
      },
    });
  });

  it("stores the text's token count alongside the text", async () => {
    await ingest();

    expect(fencedWrites().at(-1)?.data).toMatchObject({
      content: "Mitochondria make ATP.",
      tokenCount: Math.ceil("Mitochondria make ATP.".length / 4),
    });
  });

  it("digests the source on the organization's own model and stores both parts", async () => {
    await ingest();

    expect(digest.generateSourceDigest).toHaveBeenCalledWith(
      "Mitochondria make ATP.",
      ORG_SLUG,
    );
    expect(fencedWrites().at(-1)?.data).toMatchObject({
      summary: "Was die Quelle abdeckt.",
      outline: "- Kapitel 1",
    });
  });

  it("still lands the text when no digest could be produced", async () => {
    digest.generateSourceDigest.mockResolvedValue({
      summary: null,
      outline: null,
      produced: true,
    });

    const result = await ingest();

    expect(result.status).toBe(SOURCE_STATUS.READY);
    expect(fencedWrites().at(-1)?.data).toMatchObject({
      content: "Mitochondria make ATP.",
      summary: null,
      outline: null,
    });
  });
});

describe("content that hashes identically to the stored hash", () => {
  const TEXT = "Mitochondria make ATP.";

  beforeEach(() => {
    db.notebookSource.findUniqueOrThrow.mockResolvedValue(
      sourceRow({
        status: SOURCE_STATUS.READY,
        contentHash: computeContentHash(TEXT),
      }),
    );
    fakeExtractor().extract.mockResolvedValue({ text: TEXT });
  });

  it("rewrites no content, asks for no digest and flags no scene", async () => {
    await ingest();

    expect(digest.generateSourceDigest).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(tx.scene.updateMany).not.toHaveBeenCalled();
  });

  it("ends READY and reports the change as absent", async () => {
    const result = await ingest();

    expect(result).toEqual({
      sourceId: SOURCE_ID,
      status: SOURCE_STATUS.READY,
      success: true,
      previousHash: computeContentHash(TEXT),
      newHash: computeContentHash(TEXT),
      hashChanged: false,
    });
    expect(fencedWrites().at(-1)).toMatchObject({
      data: { status: SOURCE_STATUS.READY, processingToken: null },
    });
  });
});

describe("forceRebuild on content that has not changed", () => {
  const TEXT = "Mitochondria make ATP.";

  beforeEach(() => {
    db.notebookSource.findUniqueOrThrow.mockResolvedValue(
      sourceRow({
        status: SOURCE_STATUS.READY,
        contentHash: computeContentHash(TEXT),
      }),
    );
    fakeExtractor().extract.mockResolvedValue({ text: TEXT });
  });

  it("re-digests and rewrites the content anyway", async () => {
    await ingest({ forceRebuild: true });

    expect(digest.generateSourceDigest).toHaveBeenCalledWith(TEXT, ORG_SLUG);
    expect(fencedWrites().at(-1)?.data).toMatchObject({ content: TEXT });
  });

  it("still flags no scene — a new digest is not news about the author's document", async () => {
    await ingest({ forceRebuild: true });

    expect(tx.scene.updateMany).not.toHaveBeenCalled();
  });
});

describe("what a run reports back", () => {
  it("names the hash it started from, the one it ended with, and that they differ", async () => {
    db.notebookSource.findUniqueOrThrow.mockResolvedValue(
      sourceRow({
        status: SOURCE_STATUS.READY,
        contentHash: computeContentHash("The old edition."),
      }),
    );
    fakeExtractor().extract.mockResolvedValue({ text: "The new edition." });

    const result = await ingest();

    expect(result).toEqual({
      sourceId: SOURCE_ID,
      status: SOURCE_STATUS.READY,
      success: true,
      previousHash: computeContentHash("The old edition."),
      newHash: computeContentHash("The new edition."),
      hashChanged: true,
    });
  });

  it("reports a change on a first ingest only when scenes already depend on the source", async () => {
    db.sceneSourceLineage.findFirst.mockResolvedValue({ sceneId: SCENE_ID });

    const result = await ingest();

    expect(result).toMatchObject({ previousHash: null, hashChanged: true });
  });
});

describe("the revision short-circuit for integration sources", () => {
  const SYNCED_AT = new Date("2026-07-20T10:00:00.000Z");

  function integrationSource() {
    db.notebookSource.findUniqueOrThrow.mockResolvedValue(
      sourceRow({
        type: SOURCE_TYPES.NOTION_PAGE,
        status: SOURCE_STATUS.READY,
        contentHash: "stored-hash",
        externalId: "notion-page-1",
        lastSyncedAt: SYNCED_AT,
      }),
    );
    return fakeExtractor({ isIntegration: true });
  }

  it("skips extraction entirely when the provider says the page predates the last sync", async () => {
    const { extract, getRevision } = integrationSource();
    getRevision.mockResolvedValue({
      title: "Cell Biology.pdf",
      lastEdited: new Date(SYNCED_AT.getTime() - 60_000),
    });

    const result = await ingest();

    expect(extract).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      status: SOURCE_STATUS.READY,
      success: true,
      previousHash: "stored-hash",
      hashChanged: false,
    });
  });

  it("fetches the content when the provider reports a later edit", async () => {
    const { extract, getRevision } = integrationSource();
    getRevision.mockResolvedValue({
      title: "Cell Biology.pdf",
      lastEdited: new Date(SYNCED_AT.getTime() + 60_000),
    });
    extract.mockResolvedValue({ text: "Rewritten." });

    await ingest();

    expect(extract).toHaveBeenCalledTimes(1);
  });

  it("is bypassed by forceRebuild — the provider is never even asked", async () => {
    const { extract, getRevision } = integrationSource();
    extract.mockResolvedValue({ text: "Rewritten." });

    await ingest({ forceRebuild: true });

    expect(getRevision).not.toHaveBeenCalled();
    expect(extract).toHaveBeenCalledTimes(1);
  });

  it("falls through to extraction when the provider cannot answer", async () => {
    const { extract, getRevision } = integrationSource();
    getRevision.mockRejectedValue(new Error("Notion 503"));
    extract.mockResolvedValue({ text: "Rewritten." });

    const result = await ingest();

    expect(extract).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ success: true });
  });
});

describe("a READY source missing what a full ingest leaves behind", () => {
  const TEXT = "Mitochondria make ATP.";

  it.each([
    {
      name: "text stored before token counts existed",
      missing: { tokenCount: 0 },
    },
    { name: "a digest that failed", missing: { summary: null, outline: null } },
  ])("rebuilds it when it holds $name", async ({ missing }) => {
    db.notebookSource.findUniqueOrThrow.mockResolvedValue(
      sourceRow({
        status: SOURCE_STATUS.READY,
        contentHash: computeContentHash(TEXT),
        ...missing,
      }),
    );
    fakeExtractor().extract.mockResolvedValue({ text: TEXT });

    await ingest();

    expect(digest.generateSourceDigest).toHaveBeenCalledWith(TEXT, ORG_SLUG);
    expect(fencedWrites().at(-1)?.data).toMatchObject({
      content: TEXT,
      tokenCount: Math.ceil(TEXT.length / 4),
    });
  });

  it("fetches from the provider even though the revision predates the last sync", async () => {
    const { extract, getRevision } = fakeExtractor({ isIntegration: true });
    getRevision.mockResolvedValue({
      title: undefined,
      lastEdited: new Date("2026-01-01T00:00:00Z"),
    });
    db.notebookSource.findUniqueOrThrow.mockResolvedValue(
      sourceRow({
        type: SOURCE_TYPES.NOTION_PAGE,
        status: SOURCE_STATUS.READY,
        contentHash: "stored-hash",
        externalId: "page-1",
        lastSyncedAt: new Date("2026-02-01T00:00:00Z"),
        tokenCount: 0,
      }),
    );
    extract.mockResolvedValue({ text: TEXT });

    await ingest();

    expect(extract).toHaveBeenCalledTimes(1);
    expect(fencedWrites().at(-1)?.data).toMatchObject({ content: TEXT });
  });
});

describe("a second sync catches an edit that landed while the first was still processing", () => {
  const SYNCED_AT = new Date("2026-07-20T10:00:00.000Z");
  const EDIT_1 = new Date(SYNCED_AT.getTime() + 60_000);
  const EDIT_2 = new Date(SYNCED_AT.getTime() + 5 * 60_000);

  function setSourceRow(overrides: SourceRowOverrides = {}) {
    db.notebookSource.findUniqueOrThrow.mockResolvedValue(
      sourceRow({
        type: SOURCE_TYPES.NOTION_PAGE,
        status: SOURCE_STATUS.READY,
        contentHash: "stored-hash",
        externalId: "notion-page-1",
        lastSyncedAt: SYNCED_AT,
        ...overrides,
      }),
    );
  }

  function integrationSource(overrides: SourceRowOverrides = {}) {
    setSourceRow(overrides);
    return fakeExtractor({ isIntegration: true });
  }

  beforeEach(() => {
    vi.useFakeTimers({ now: SYNCED_AT.getTime() + 20 * 60_000 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("re-ingests on the second sync (Gate A re-triggers extraction)", async () => {
    const { extract, getRevision } = integrationSource();
    getRevision.mockResolvedValueOnce({ title: "Doc", lastEdited: EDIT_1 });
    extract.mockResolvedValueOnce({ text: "First edit.", lastEdited: EDIT_1 });

    await ingest();
    expect(extract).toHaveBeenCalledTimes(1);

    const persistedLastSyncedAt = fencedWrites().at(-1)?.data.lastSyncedAt;
    setSourceRow({
      contentHash: computeContentHash("First edit."),
      lastSyncedAt: persistedLastSyncedAt,
    });
    getRevision.mockResolvedValueOnce({ title: "Doc", lastEdited: EDIT_2 });
    extract.mockResolvedValueOnce({ text: "Second edit.", lastEdited: EDIT_2 });

    await ingest();

    expect(extract).toHaveBeenCalledTimes(2);
  });

  it("does not rewrite on the second sync when the re-fetched content actually matches (Gate B still skips)", async () => {
    const TEXT = "Unchanged edition.";
    const { extract, getRevision } = integrationSource({
      contentHash: computeContentHash(TEXT),
    });

    getRevision.mockResolvedValueOnce({ title: "Doc", lastEdited: EDIT_1 });
    extract.mockResolvedValueOnce({ text: TEXT, lastEdited: EDIT_1 });

    await ingest();
    expect(extract).toHaveBeenCalledTimes(1);

    const persistedLastSyncedAt = fencedWrites().at(-1)?.data.lastSyncedAt;
    setSourceRow({
      contentHash: computeContentHash(TEXT),
      lastSyncedAt: persistedLastSyncedAt,
    });
    getRevision.mockResolvedValueOnce({ title: "Doc", lastEdited: EDIT_2 });
    extract.mockResolvedValueOnce({ text: TEXT, lastEdited: EDIT_2 });

    await ingest();

    expect(extract).toHaveBeenCalledTimes(2);
    expect(digest.generateSourceDigest).not.toHaveBeenCalled();
  });
});

describe("a run that does not hold the claim", () => {
  beforeEach(() => {
    claimWon = false;
  });

  it("extracts nothing, digests nothing and writes nothing", async () => {
    const { extract } = fakeExtractor();

    await ingest();

    expect(db.notebookSource.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(extract).not.toHaveBeenCalled();
    expect(digest.generateSourceDigest).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();

    expect(db.notebookSource.updateMany).toHaveBeenCalledTimes(1);
    expect(fencedWrites()).toEqual([]);
  });

  it("is refused as an ordinary result, never as a thrown error", async () => {
    await expect(ingest()).resolves.toEqual({
      sourceId: SOURCE_ID,
      status: SOURCE_STATUS.PROCESSING,
      success: false,
      error: expect.stringContaining("in progress"),
    });
  });
});

describe("a run whose claim is no longer its own", () => {
  beforeEach(() => {
    claimStillOurs = false;
  });

  it("discards its result: no content, no status, no hash, no flag", async () => {
    const result = await ingest();

    expect(tx.scene.updateMany).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      status: SOURCE_STATUS.PROCESSING,
      success: false,
    });
  });

  it("does not mark the source FAILED — it belongs to whoever holds the claim now", async () => {
    const result = await ingest();

    expect(result.status).not.toBe(SOURCE_STATUS.FAILED);
    for (const write of fencedWrites()) {
      expect(write.data.status).not.toBe(SOURCE_STATUS.FAILED);
    }
  });

  it("discards the short-circuit result too, when nothing needed re-ingesting", async () => {
    const TEXT = "Mitochondria make ATP.";
    db.notebookSource.findUniqueOrThrow.mockResolvedValue(
      sourceRow({
        status: SOURCE_STATUS.READY,
        contentHash: computeContentHash(TEXT),
      }),
    );
    fakeExtractor().extract.mockResolvedValue({ text: TEXT });

    const result = await ingest();

    expect(result).toMatchObject({
      status: SOURCE_STATUS.PROCESSING,
      success: false,
    });
  });
});

describe("what the fence is conditional on", () => {
  it.each([
    { name: "a run that commits", failing: false },
    { name: "a run that fails", failing: true },
  ])(
    "every write $name makes names both PROCESSING and the token its claim minted",
    async ({ failing }) => {
      if (failing) {
        fakeExtractor().extract.mockRejectedValue(new Error("S3 timeout"));
      }

      await ingest();

      const writes = fencedWrites();
      expect(writes.length).toBeGreaterThan(0);
      expect(typeof mintedToken()).toBe("string");
      for (const write of writes) {
        expect(write.where).toMatchObject({
          id: SOURCE_ID,
          status: SOURCE_STATUS.PROCESSING,
          processingToken: mintedToken(),
        });
      }
    },
  );
});

describe("what the write transaction holds", () => {
  it("obtains the digest before it opens", async () => {
    await ingest();

    expect(callOrder(digest.generateSourceDigest)).toBeLessThan(
      callOrder(db.$transaction),
    );
  });
});

describe("a failure before commit", () => {
  const GENERIC =
    "This source could not be imported. Try re-syncing it, or replace the file.";

  it.each([
    {
      name: "the provider fetch fails",

      stored: GENERIC,
      arrange: () => {
        fakeExtractor().extract.mockRejectedValue(
          new Error("Notion returned 500"),
        );
      },
    },
    {
      name: "the document holds no text",

      stored: "No text could be extracted from the source.",
      arrange: () => {
        fakeExtractor().extract.mockResolvedValue({ text: "   \n  " });
      },
    },
  ])(
    "leaves the stored content intact when $name",
    async ({ arrange, stored }) => {
      arrange();

      const result = await ingest();

      expect(db.$transaction).not.toHaveBeenCalled();
      expect(result).toEqual({
        sourceId: SOURCE_ID,
        status: SOURCE_STATUS.FAILED,
        success: false,
        error: stored,
      });
      expect(fencedWrites().at(-1)).toMatchObject({
        data: {
          status: SOURCE_STATUS.FAILED,
          error: stored,
          processingStartedAt: null,
          processingToken: null,
        },
      });
    },
  );

  it("keeps the database's own words out of the panel when the commit fails", async () => {
    tx.notebookSource.updateMany.mockRejectedValue(
      new Error("deadlock detected"),
    );

    const result = await ingest();

    expect(result).toMatchObject({
      status: SOURCE_STATUS.FAILED,
      success: false,
      error: GENERIC,
    });
    expect(fencedWrites().at(-1)).toMatchObject({
      data: { status: SOURCE_STATUS.FAILED, error: GENERIC },
    });
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining(SOURCE_ID),
      expect.objectContaining({ message: "deadlock detected" }),
    );
  });
});

describe("a source over the word cap", () => {
  beforeEach(() => {
    fakeExtractor().extract.mockResolvedValue({
      text: `${"paragraph ".repeat(50_010)}end`,
    });
  });

  it("is truncated and ingested, not rejected", async () => {
    const result = await ingest();

    expect(result).toMatchObject({
      status: SOURCE_STATUS.READY,
      success: true,
    });
    expect(fencedWrites().at(-1)?.data.content).toEqual(
      expect.stringContaining("paragraph"),
    );
  });

  it("records the truncation on the source, where the author can see it", async () => {
    await ingest();

    const write = fencedWrites().at(-1);
    expect(write?.data.warning).toEqual(expect.stringContaining("truncated"));
  });

  it("records no warning when nothing was cut", async () => {
    fakeExtractor().extract.mockResolvedValue({ text: "Short enough." });

    await ingest();

    expect(fencedWrites().at(-1)).toMatchObject({ data: { warning: null } });
  });
});

describe("when the dependent scenes are flagged", () => {
  it("writes the flags in the same transaction as the ingest that caused them", async () => {
    db.notebookSource.findUniqueOrThrow.mockResolvedValue(
      sourceRow({
        status: SOURCE_STATUS.READY,
        contentHash: computeContentHash("The old edition."),
      }),
    );
    fakeExtractor().extract.mockResolvedValue({ text: "The new edition." });

    await ingest();

    expect(tx.scene.updateMany).toHaveBeenCalledWith({
      where: {
        courseVersionId: null,
        sourceLineages: { some: { sourceId: SOURCE_ID } },
      },
      data: { isOutdated: true, outdatedReason: "SOURCE_CHANGED" },
    });
  });
});

describe("a run that digests and persists", () => {
  it("debits exactly one generation, against the source's own organization", async () => {
    await ingest();

    expect(charges()).toEqual([
      expect.objectContaining({
        organizationId: ORG_ID,
        action: "SOURCE_INGEST",
        notebookId: "nb-1",
      }),
    ]);
    expect(balance).toBe(99);
  });

  it("charges the same whichever surface asked for it", async () => {
    await ingest({ forceRebuild: true });

    expect(charges()).toHaveLength(1);
  });

  it("digests nothing until the debit has gone through", async () => {
    await ingest();

    expect(callOrder(entitlement.chargeAiGeneration)).toBeLessThan(
      callOrder(digest.generateSourceDigest),
    );
  });
});

describe("a run that digests nothing", () => {
  it("costs nothing when the provider says the page predates the last sync", async () => {
    const { getRevision } = fakeExtractor({ isIntegration: true });
    getRevision.mockResolvedValue({
      lastEdited: new Date("2026-01-01T00:00:00Z"),
      title: undefined,
    });
    db.notebookSource.findUniqueOrThrow.mockResolvedValue(
      sourceRow({
        status: SOURCE_STATUS.READY,
        contentHash: "stored-hash",
        externalId: "page-1",
        lastSyncedAt: new Date("2026-02-01T00:00:00Z"),
      }),
    );

    await ingest();

    expect(charges()).toEqual([]);
    expect(balance).toBe(100);
  });

  it("costs nothing when the content hashes identically", async () => {
    const TEXT = "Mitochondria make ATP.";
    db.notebookSource.findUniqueOrThrow.mockResolvedValue(
      sourceRow({
        status: SOURCE_STATUS.READY,
        contentHash: computeContentHash(TEXT),
      }),
    );
    fakeExtractor().extract.mockResolvedValue({ text: TEXT });

    await ingest();

    expect(charges()).toEqual([]);
    expect(balance).toBe(100);
  });

  it("costs nothing when the run lost its claim", async () => {
    claimStillOurs = false;

    const result = await ingest();

    expect(balance).toBe(100);
    expect(result.status).not.toBe(SOURCE_STATUS.FAILED);
  });
});

describe("a run that fails after the debit", () => {
  it("gets the generation back", async () => {
    tx.notebookSource.updateMany.mockRejectedValue(
      new Error("deadlock detected"),
    );

    await ingest();

    expect(charges()).toHaveLength(1);
    expect(balance).toBe(100);
  });

  it("gets it back when the digest model never answered, and still lands the text", async () => {
    digest.generateSourceDigest.mockResolvedValue({
      summary: null,
      outline: null,
      produced: false,
    });

    const result = await ingest();

    expect(balance).toBe(100);
    expect(result.status).toBe(SOURCE_STATUS.READY);
    expect(fencedWrites().at(-1)?.data).toMatchObject({
      content: "Mitochondria.",
    });
  });

  it("keeps it when the digest model answered with something unusable", async () => {
    digest.generateSourceDigest.mockResolvedValue({
      summary: null,
      outline: null,
      produced: true,
    });

    await ingest();

    expect(balance).toBe(99);
  });
});

describe("a run the organization cannot pay for", () => {
  beforeEach(() => {
    balance = 0;
  });

  it("is left PENDING with the reason, having digested nothing", async () => {
    const result = await ingest();

    expect(digest.generateSourceDigest).not.toHaveBeenCalled();

    expect(result).toEqual({
      sourceId: SOURCE_ID,
      status: SOURCE_STATUS.PENDING,
      success: false,
      error: "The organization has no AI generations left.",
    });
  });

  it("releases the claim so a later open can pick the source back up", async () => {
    await ingest();

    const [release] = fencedWrites().slice(-1);
    expect(release?.data).toMatchObject({
      status: SOURCE_STATUS.PENDING,
      processingToken: null,
      processingStartedAt: null,
    });
  });

  it("leaves the stored content intact", async () => {
    db.notebookSource.findUniqueOrThrow.mockResolvedValue(
      sourceRow({
        status: SOURCE_STATUS.READY,
        contentHash: computeContentHash("The old edition."),
      }),
    );
    fakeExtractor().extract.mockResolvedValue({ text: "The new edition." });

    await ingest();

    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("does not reject — a batch of sources must not fail as a whole", async () => {
    await expect(ingest()).resolves.toMatchObject({
      success: false,
    });
  });
});

describe("who the ledger names", () => {
  it("names the member whose request triggered the run", async () => {
    await ingest({ actorId: "user-7" });

    expect(charges()[0]).toMatchObject({ actorId: "user-7" });
  });

  it("names nobody for unattended work", async () => {
    await ingest();

    expect(charges()[0]).toMatchObject({ actorId: null });
  });
});

describe("a run on the organization's own endpoint", () => {
  beforeEach(() => {
    db.organization.findUnique.mockResolvedValue({
      defaultChatModelId: "org-model-1",
    });
  });

  it("digests and persists without spending a generation", async () => {
    const result = await ingest();

    expect(result).toMatchObject({ status: SOURCE_STATUS.READY });
    expect(digest.generateSourceDigest).toHaveBeenCalled();
    expect(charges()).toEqual([]);
    expect(balance).toBe(100);
  });

  it("still owes the plan check the debit would have made", async () => {
    await ingest();

    expect(entitlement.decideOwnEndpointGeneration).toHaveBeenCalledWith(
      db,
      ORG_ID,
    );
  });

  it("digests nothing once the plan no longer includes its own endpoint", async () => {
    entitlement.decideOwnEndpointGeneration.mockResolvedValue({
      refusal: {
        applicationCode: "entitlement.byoai_generation_withdrawn",
        message: "Generating on your own AI endpoint is included from Pro up.",
      },
    });

    await expect(ingest()).resolves.toMatchObject({ success: false });
    expect(digest.generateSourceDigest).not.toHaveBeenCalled();
  });
});
