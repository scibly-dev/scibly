import { notLapsedSubscription } from "@scibly/api/entitlement";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SOURCE_STATUS } from "@/shared/content/sources/constants";

const db = vi.hoisted(() => ({
  integrationConnection: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    updateMany: vi.fn(),
    updateManyAndReturn: vi.fn(),
  },
  notebookSource: { findMany: vi.fn(), updateMany: vi.fn() },
  $transaction: vi.fn(),
}));

const provider = vi.hoisted(() => ({ pollModifiedPages: vi.fn() }));
const registry = vi.hoisted(() => ({ getPageProvider: vi.fn() }));
const token = vi.hoisted(() => ({ resolveConnectionToken: vi.fn() }));

vi.mock("@scibly/db", () => ({ db }));
vi.mock("@/features/integrations/server/registry", () => registry);
vi.mock("@/features/integrations/server/connection-token", () => token);

const {
  backoffMs,
  getPollingStart,
  loadDueConnections,
  pollConnection,
  recordPollFailure,
  SYNC_CLOCK_SKEW_MS,
  SYNC_WINDOW_FLOOR_MS,
} = await import("./sync-source-freshness");

const NOW = new Date("2026-07-27T03:00:00.000Z");
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

type Connection = {
  id: string;
  provider: string;
  accessTokenEncrypted: string;
  lastPolledAt: Date | null;
};

function connection(overrides: Partial<Connection> = {}): Connection {
  return {
    id: "conn-1",
    provider: "NOTION",
    accessTokenEncrypted: "encrypted-token",
    lastPolledAt: null,
    ...overrides,
  };
}

function stored(row: Partial<Connection>) {
  db.integrationConnection.findUnique.mockResolvedValue(row);
}

// The failure counter is incremented by the database, so a test says what the database settled on rather than what the row held beforehand.
function counted(consecutiveFailures: number) {
  db.integrationConnection.updateManyAndReturn.mockResolvedValue([
    { consecutiveFailures },
  ]);
}

function sources(...rows: { id: string; externalId: string | null }[]): void {
  db.notebookSource.findMany.mockResolvedValue(rows);
}

function modified(...externalIds: string[]): void {
  provider.pollModifiedPages.mockResolvedValue(
    externalIds.map((id) => ({ id })),
  );
}

function markedStale(): string[] {
  return db.notebookSource.updateMany.mock.calls.flatMap(
    ([args]) => args.where.id.in,
  );
}

// A failure writes twice — the counted increment, then the backoff it implies — so this is everything an attempt put on the row.
function writtenTo(connectionId: string) {
  const written = [
    ...db.integrationConnection.updateMany.mock.calls,
    ...db.integrationConnection.updateManyAndReturn.mock.calls,
  ]
    .filter(([args]) => args.where.id === connectionId)
    .map(([args]) => args.data);
  return written.length === 0 ? undefined : Object.assign({}, ...written);
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers({ now: NOW });

  db.integrationConnection.findMany.mockResolvedValue([]);
  db.integrationConnection.findUnique.mockResolvedValue(connection());
  db.integrationConnection.updateMany.mockResolvedValue({ count: 1 });
  counted(1);
  db.notebookSource.findMany.mockResolvedValue([]);
  db.notebookSource.updateMany.mockImplementation(
    async ({ where }: { where: { id: { in: string[] } } }) => ({
      count: where.id.in.length,
    }),
  );
  db.$transaction.mockImplementation(async (ops: Promise<unknown>[]) =>
    Promise.all(ops),
  );
  registry.getPageProvider.mockReturnValue(provider);
  token.resolveConnectionToken.mockResolvedValue("plain-token");
  provider.pollModifiedPages.mockResolvedValue([]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("KW1/KW4/KW5: the interval a poll covers", () => {
  it.each([
    {
      case: "a connection that has never been polled takes the floor",
      lastPolledAt: null,
      expected: new Date(NOW.getTime() - SYNC_WINDOW_FLOOR_MS),
    },
    {
      case: "a recent poll covers everything since it, less clock skew",
      lastPolledAt: new Date(NOW.getTime() - DAY),
      expected: new Date(NOW.getTime() - DAY - SYNC_CLOCK_SKEW_MS),
    },
    {
      case: "a dormant connection is floored rather than asking for a year",
      lastPolledAt: new Date(NOW.getTime() - 365 * DAY),
      expected: new Date(NOW.getTime() - SYNC_WINDOW_FLOOR_MS),
    },
    {
      case: "a watermark exactly one skew inside the floor",
      lastPolledAt: new Date(
        NOW.getTime() - SYNC_WINDOW_FLOOR_MS + SYNC_CLOCK_SKEW_MS,
      ),
      expected: new Date(NOW.getTime() - SYNC_WINDOW_FLOOR_MS),
    },
  ])("$case", ({ lastPolledAt, expected }) => {
    expect(getPollingStart(lastPolledAt, NOW)).toEqual(expected);
  });

  it("asks the provider for the window its own watermark implies", async () => {
    const lastPolledAt = new Date(NOW.getTime() - 6 * HOUR);
    stored(connection({ lastPolledAt }));
    sources({ id: "src-a", externalId: "page-a" });

    await pollConnection("conn-1");

    expect(provider.pollModifiedPages).toHaveBeenCalledWith(
      "plain-token",
      new Date(lastPolledAt.getTime() - SYNC_CLOCK_SKEW_MS),
    );
  });

  it("KW5: never reads a source's own sync timestamp to decide the window", async () => {
    stored(connection({ lastPolledAt: new Date(NOW.getTime() - HOUR) }));
    sources({ id: "src-a", externalId: "page-a" });

    await pollConnection("conn-1");

    const [args] = db.notebookSource.findMany.mock.calls[0];
    expect(args.select).toEqual({ id: true, externalId: true });
  });
});

describe("KS1/KS2/KF3/KB1/KB2/KB4: which connections a sync is due to poll", () => {
  it("KS2: takes the least-recently-attempted first", async () => {
    await loadDueConnections(NOW);

    const [args] = db.integrationConnection.findMany.mock.calls[0];
    expect(args.orderBy).toEqual({
      lastAttemptedAt: { sort: "asc", nulls: "first" },
    });
  });

  it("takes one run's worth, so the event batch it feeds has a ceiling", async () => {
    await loadDueConnections(NOW);

    const [args] = db.integrationConnection.findMany.mock.calls[0];
    expect(args.take).toBeGreaterThan(0);
  });

  it("KF3: excludes a connection still inside its backoff", async () => {
    await loadDueConnections(NOW);

    const [args] = db.integrationConnection.findMany.mock.calls[0];
    expect(args.where.AND).toContainEqual({
      OR: [{ nextPollAfter: null }, { nextPollAfter: { lte: NOW } }],
    });
  });

  it("KF3: excludes a connection left without a credential by a disconnect", async () => {
    await loadDueConnections(NOW);

    const [args] = db.integrationConnection.findMany.mock.calls[0];
    expect(args.where.AND).toContainEqual({
      OR: [
        { accessTokenEncrypted: { not: null } },
        { installationId: { not: null } },
      ],
    });
  });

  it("KB1/KB2: owes only connections of an organization with a live subscription", async () => {
    await loadDueConnections(NOW);

    const [args] = db.integrationConnection.findMany.mock.calls[0];
    expect(args.where.organization).toEqual({
      subscription: notLapsedSubscription(NOW),
    });
  });

  it("KB4: does not restate the affordability rule the debit already owns", async () => {
    await loadDueConnections(NOW);

    const [args] = db.integrationConnection.findMany.mock.calls[0];
    expect(Object.keys(args.where.organization)).toEqual(["subscription"]);
  });

  it("hands out an id and a provider, never a credential", async () => {
    await loadDueConnections(NOW);

    const [args] = db.integrationConnection.findMany.mock.calls[0];
    expect(args.select).toEqual({ id: true, provider: true });
  });
});

describe("KS3/KS4: which sources a connection contributes", () => {
  it("takes only READY sources with an external page behind them", async () => {
    stored(connection({ id: "conn-7" }));
    sources({ id: "src-a", externalId: "page-a" });

    await pollConnection("conn-7");

    const [args] = db.notebookSource.findMany.mock.calls[0];
    expect(args.where).toEqual({
      integrationId: "conn-7",
      status: SOURCE_STATUS.READY,
      externalId: { not: null },
    });
  });

  it("does not poll a connection with nothing syncable behind it", async () => {
    sources();

    const outcome = await pollConnection("conn-1");

    expect(provider.pollModifiedPages).not.toHaveBeenCalled();
    expect(outcome).toEqual({ status: "empty" });
  });

  it("records the attempt as the success it is, so an emptied connection leaves its backoff", async () => {
    sources();

    await pollConnection("conn-1");

    expect(writtenTo("conn-1")).toEqual({
      lastAttemptedAt: NOW,
      consecutiveFailures: 0,
      nextPollAfter: null,
    });
  });
});

describe("KR1/KR3: what a poll marks and what it reports", () => {
  beforeEach(() => {
    sources(
      { id: "src-a", externalId: "page-a" },
      { id: "src-b", externalId: "page-b" },
      { id: "src-c", externalId: "page-c" },
    );
  });

  it("KR1: marks only the sources the provider reported as modified", async () => {
    modified("page-b");

    const outcome = await pollConnection("conn-1");

    expect(markedStale()).toEqual(["src-b"]);
    expect(outcome).toEqual({ status: "polled", marked: 1, unchanged: 2 });
  });

  it("KR1: marks nothing when the provider reports no changes", async () => {
    modified();

    const outcome = await pollConnection("conn-1");

    expect(db.notebookSource.updateMany).not.toHaveBeenCalled();
    expect(outcome).toEqual({ status: "polled", marked: 0, unchanged: 3 });
  });

  it("KR3: marks a connection's whole changed set in one write", async () => {
    modified("page-a", "page-b", "page-c");

    const outcome = await pollConnection("conn-1");

    expect(db.notebookSource.updateMany).toHaveBeenCalledTimes(1);
    expect(markedStale()).toEqual(["src-a", "src-b", "src-c"]);
    expect(outcome).toEqual({ status: "polled", marked: 3, unchanged: 0 });
  });

  it("KB4: leaves the mark for the ingest to clear, changing nothing else", async () => {
    modified("page-a");

    await pollConnection("conn-1");

    const [args] = db.notebookSource.updateMany.mock.calls[0];
    expect(args.data).toEqual({ staleAt: NOW });
  });
});

describe("KF1: a poll that cannot run", () => {
  it.each([
    {
      case: "a provider the registry does not know",
      break: () =>
        registry.getPageProvider.mockImplementation(() => {
          throw new Error("Unknown provider: gone");
        }),
      message: "Unknown provider: gone",
    },
    {
      case: "a credential that will not decrypt",
      break: () =>
        token.resolveConnectionToken.mockRejectedValue(
          new Error("bad ciphertext"),
        ),
      message: "bad ciphertext",
    },
    {
      case: "a poll the provider rejects",
      break: () =>
        provider.pollModifiedPages.mockRejectedValue(
          new Error("401 from provider"),
        ),
      message: "401 from provider",
    },
  ])(
    "$case throws, so Inngest is the one that retries it",
    async (scenario) => {
      sources({ id: "src-a", externalId: "page-a" });
      scenario.break();

      await expect(pollConnection("conn-1")).rejects.toThrow(scenario.message);
    },
  );

  it("KW2: a throwing poll writes nothing at all — not the watermark, not the attempt", async () => {
    stored(connection({ lastPolledAt: new Date(NOW.getTime() - 3 * DAY) }));
    sources({ id: "src-a", externalId: "page-a" });
    provider.pollModifiedPages.mockRejectedValue(new Error("provider down"));

    await expect(pollConnection("conn-1")).rejects.toThrow();

    expect(db.integrationConnection.updateMany).not.toHaveBeenCalled();
    expect(db.notebookSource.updateMany).not.toHaveBeenCalled();
  });

  it("a connection disconnected before its turn is not polled and not backed off", async () => {
    db.integrationConnection.findUnique.mockResolvedValue(null);
    db.integrationConnection.updateManyAndReturn.mockResolvedValue([]);

    expect(await pollConnection("conn-gone")).toEqual({ status: "gone" });
    expect(db.integrationConnection.updateMany).not.toHaveBeenCalled();

    await recordPollFailure("conn-gone", NOW);
    expect(db.integrationConnection.updateMany).not.toHaveBeenCalled();
  });
});

describe("KW1/KW2/KF2/KF3/KF4: what an attempt writes down", () => {
  it("KW1: the watermark takes the instant the poll started, not the one it ended", async () => {
    sources({ id: "src-a", externalId: "page-a" });
    provider.pollModifiedPages.mockImplementation(async () => {
      vi.advanceTimersByTime(30_000);
      return [];
    });

    await pollConnection("conn-1");

    expect(writtenTo("conn-1")).toMatchObject({
      lastPolledAt: NOW,
      lastAttemptedAt: new Date(NOW.getTime() + 30_000),
    });
  });

  it("KF2: a failure moves the attempt timestamp and has the database count", async () => {
    counted(1);

    await recordPollFailure("conn-1", NOW);

    expect(writtenTo("conn-1")).toMatchObject({
      lastAttemptedAt: NOW,
      consecutiveFailures: { increment: 1 },
    });
  });

  it("KF2: two failures racing over one connection land on two, not one", async () => {
    counted(2);

    await recordPollFailure("conn-1", NOW);

    expect(db.integrationConnection.findUnique).not.toHaveBeenCalled();
    expect(writtenTo("conn-1")).toMatchObject({ nextPollAfter: null });
  });

  it("KW2: a failure leaves the watermark where it was", async () => {
    counted(1);

    await recordPollFailure("conn-1", NOW);

    expect(writtenTo("conn-1")).not.toHaveProperty("lastPolledAt");
  });

  it.each([
    { settled: 1, case: "nothing for the first failure", expected: 0 },
    { settled: 2, case: "nothing for the second", expected: 0 },
    { settled: 3, case: "6h once the third lands", expected: 6 * HOUR },
    { settled: 4, case: "24h for the fourth", expected: DAY },
    { settled: 5, case: "72h for the fifth", expected: 3 * DAY },
    {
      settled: 9,
      case: "capped at 3 days however long it stays broken",
      expected: 3 * DAY,
    },
  ])(
    "KF3: backs a failing connection off — $case",
    async ({ settled, expected }) => {
      counted(settled);

      await recordPollFailure("conn-1", NOW);

      expect(writtenTo("conn-1")).toMatchObject({
        nextPollAfter:
          expected === 0 ? null : new Date(NOW.getTime() + expected),
      });
    },
  );

  it("KF3: the backoff table is what the counter indexes into", () => {
    expect(backoffMs(0)).toBe(0);
    expect(backoffMs(3)).toBe(6 * HOUR);

    expect(backoffMs(99)).toBe(3 * DAY);
  });

  it("KF4: any success clears the backoff and the failure count", async () => {
    sources({ id: "src-a", externalId: "page-a" });

    await pollConnection("conn-1");

    expect(writtenTo("conn-1")).toEqual({
      lastPolledAt: NOW,
      lastAttemptedAt: NOW,
      consecutiveFailures: 0,
      nextPollAfter: null,
    });
  });
});
