import { notLapsedSubscription } from "@scibly/api/entitlement";
import { routes } from "@scibly/routes";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PAGE_INTEGRATION_PROVIDERS } from "@/features/integrations/contracts";
import { SOURCE_STATUS } from "@/shared/content/sources/constants";

const db = vi.hoisted(() => ({
  integrationConnection: { findMany: vi.fn(), update: vi.fn() },
  notebookSource: { findMany: vi.fn(), updateMany: vi.fn() },
  integrationSyncLease: {
    updateMany: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
  },
}));

const provider = vi.hoisted(() => ({ pollModifiedPages: vi.fn() }));
const registry = vi.hoisted(() => ({
  getProvider: vi.fn(),
  getPageProvider: vi.fn(),
}));
const crypto = vi.hoisted(() => ({ decryptApiKey: vi.fn() }));

vi.mock("@scibly/db", async () => {
  const client = await import("@scibly/db/client");
  return { db, Prisma: client.Prisma };
});
vi.mock("@/features/integrations/server/registry", () => registry);
vi.mock("@/lib/crypto/api-key", () => crypto);
vi.mock("@/env", () => ({
  env: {
    CRON_SECRET: "test-cron-secret",
    NEXT_PUBLIC_APP_URL: "https://app.test",
  },
}));

const prismaClient = await import("@scibly/db/client");
const {
  acquireSyncLease,
  backoffMs,
  continueSyncLease,
  getPollingStart,
  loadOwedConnections,
  MAX_SYNC_HOPS,
  releaseSyncLease,
  runSyncHop,
  SYNC_HOP_CONNECTION_LIMIT,
  SYNC_CLOCK_SKEW_MS,
  SYNC_HOP_DEADLINE_MS,
  SYNC_WINDOW_FLOOR_MS,
} = await import("./sync-source-freshness");

const NOW = new Date("2026-07-27T03:00:00.000Z");
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const CHAIN_STARTED_AT = new Date("2026-07-27T02:59:00.000Z");
const LEASE = {
  token: "lease-token",
  chainStartedAt: CHAIN_STARTED_AT,
  hops: 0,
};

type Connection = {
  id: string;
  provider: string;
  accessTokenEncrypted: string;
  lastPolledAt: Date | null;
  consecutiveFailures: number;
};

const fetchMock = vi.fn();

function connection(overrides: Partial<Connection> = {}): Connection {
  return {
    id: "conn-1",
    provider: "notion",
    accessTokenEncrypted: "encrypted-token",
    lastPolledAt: null,
    consecutiveFailures: 0,
    ...overrides,
  };
}

function owed(batch: Connection[], remaining: Connection[] = []): void {
  db.integrationConnection.findMany
    .mockResolvedValueOnce(batch)
    .mockResolvedValueOnce(remaining);
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

function writtenTo(connectionId: string) {
  const call = db.integrationConnection.update.mock.calls.find(
    ([args]) => args.where.id === connectionId,
  );
  return call?.[0].data;
}

function uniqueViolation() {
  return new prismaClient.Prisma.PrismaClientKnownRequestError(
    "Unique constraint failed",
    { code: "P2002", clientVersion: "7.8.0" },
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers({ now: NOW });
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.stubGlobal("fetch", fetchMock);

  fetchMock.mockResolvedValue({ ok: true });
  db.integrationConnection.findMany.mockResolvedValue([]);
  db.integrationConnection.update.mockResolvedValue({});
  db.notebookSource.findMany.mockResolvedValue([]);
  db.notebookSource.updateMany.mockImplementation(
    async ({ where }: { where: { id: { in: string[] } } }) => ({
      count: where.id.in.length,
    }),
  );
  db.integrationSyncLease.updateMany.mockResolvedValue({ count: 1 });
  db.integrationSyncLease.create.mockResolvedValue({ id: "singleton" });
  db.integrationSyncLease.findUnique.mockResolvedValue({
    token: LEASE.token,
    chainStartedAt: CHAIN_STARTED_AT,
    hops: 1,
  });
  registry.getProvider.mockReturnValue(provider);
  registry.getPageProvider.mockReturnValue(provider);
  crypto.decryptApiKey.mockReturnValue("plain-token");
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
    owed([connection({ lastPolledAt })]);
    sources({ id: "src-a", externalId: "page-a" });

    await runSyncHop(LEASE);

    expect(provider.pollModifiedPages).toHaveBeenCalledWith(
      "plain-token",
      new Date(lastPolledAt.getTime() - SYNC_CLOCK_SKEW_MS),
    );
  });

  it("KW5: never reads a source's own sync timestamp to decide the window", async () => {
    owed([connection({ lastPolledAt: new Date(NOW.getTime() - HOUR) })]);
    sources({ id: "src-a", externalId: "page-a" });

    await runSyncHop(LEASE);

    const [args] = db.notebookSource.findMany.mock.calls[0];
    expect(args.select).toEqual({ id: true, externalId: true });
  });
});

describe("KS1/KS2/KC1/KC4: which connections a hop is accountable for", () => {
  it("takes the least-recently-attempted first, bounded by the batch", async () => {
    await loadOwedConnections(LEASE, NOW);

    const [args] = db.integrationConnection.findMany.mock.calls[0];

    expect(args.orderBy).toEqual({
      lastAttemptedAt: { sort: "asc", nulls: "first" },
    });
    expect(args.take).toBe(SYNC_HOP_CONNECTION_LIMIT);
  });

  it("KC4: owes only connections not yet attempted in this chain", async () => {
    await loadOwedConnections(LEASE, NOW);

    const [args] = db.integrationConnection.findMany.mock.calls[0];
    expect(args.where.OR).toEqual([
      { lastAttemptedAt: null },
      { lastAttemptedAt: { lt: CHAIN_STARTED_AT } },
    ]);
  });

  it("owes only connections to a provider that has pages to poll", async () => {
    await loadOwedConnections(LEASE, NOW);

    const [args] = db.integrationConnection.findMany.mock.calls[0];

    expect(args.where.provider).toEqual({
      in: [...PAGE_INTEGRATION_PROVIDERS],
    });
  });

  it("KF3: excludes a connection still inside its backoff", async () => {
    await loadOwedConnections(LEASE, NOW);

    const [args] = db.integrationConnection.findMany.mock.calls[0];

    expect(args.where.AND).toEqual([
      { OR: [{ nextPollAfter: null }, { nextPollAfter: { lte: NOW } }] },
    ]);
  });
});

describe("KB1/KB2/KB3/KB4: organizations that can pay for what a poll leads to", () => {
  it("KB1/KB2: owes only connections of an organization with a live subscription", async () => {
    await loadOwedConnections(LEASE, NOW);

    const [args] = db.integrationConnection.findMany.mock.calls[0];

    expect(args.where.organization).toEqual({
      subscription: notLapsedSubscription(NOW),
    });
  });

  it("KB4: does not restate the affordability rule the debit already owns", async () => {
    await loadOwedConnections(LEASE, NOW);

    const [args] = db.integrationConnection.findMany.mock.calls[0];

    expect(Object.keys(args.where.organization)).toEqual(["subscription"]);
  });

  it("KB4: charges nothing itself — marking is the whole of what a poll does", async () => {
    owed([connection()]);
    sources({ id: "src-a", externalId: "page-a" });
    modified("page-a");

    const { totals } = await runSyncHop(LEASE);

    expect(totals).toMatchObject({ marked: 1 });
    expect(db.notebookSource.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["src-a"] } },
      data: { staleAt: NOW },
    });
  });

  it("KB1: a hop whose only connections lapsed polls nothing and ends the chain", async () => {
    owed([]);

    const { totals, continued } = await runSyncHop(LEASE);

    expect(provider.pollModifiedPages).not.toHaveBeenCalled();
    expect(totals).toMatchObject({ polled: 0, connectionsFailed: 0 });
    expect(continued).toBe(false);
  });

  it("KB3: a restored subscription resumes from the watermark it was skipped with", async () => {
    const lastPolledAt = new Date(NOW.getTime() - 3 * DAY);
    owed([connection({ id: "conn-restored", lastPolledAt })]);
    sources({ id: "src-a", externalId: "page-a" });
    modified("page-a");

    await runSyncHop(LEASE);

    expect(provider.pollModifiedPages).toHaveBeenCalledWith(
      "plain-token",
      new Date(lastPolledAt.getTime() - SYNC_CLOCK_SKEW_MS),
    );
    expect(writtenTo("conn-restored")).toMatchObject({
      lastPolledAt: NOW,
      consecutiveFailures: 0,
      nextPollAfter: null,
    });
  });
});

describe("KS3/KS4: which sources a connection contributes", () => {
  it("takes only READY sources with an external page behind them", async () => {
    owed([connection({ id: "conn-7" })]);
    sources({ id: "src-a", externalId: "page-a" });

    await runSyncHop(LEASE);

    const [args] = db.notebookSource.findMany.mock.calls[0];
    expect(args.where).toEqual({
      integrationId: "conn-7",
      status: SOURCE_STATUS.READY,
      externalId: { not: null },
    });
  });

  it("does not poll a connection with nothing syncable behind it", async () => {
    owed([connection()]);
    sources();

    const { totals } = await runSyncHop(LEASE);

    expect(provider.pollModifiedPages).not.toHaveBeenCalled();
    expect(totals.connectionsEmpty).toBe(1);
    expect(totals.connectionsFailed).toBe(0);
  });

  it("still records the attempt, so an empty connection cannot stall the chain", async () => {
    owed([connection()]);
    sources();

    await runSyncHop(LEASE);

    expect(writtenTo("conn-1")).toEqual({ lastAttemptedAt: NOW });
  });
});

describe("KF1: one broken integration", () => {
  const broken = connection({ id: "conn-broken" });
  const healthy = connection({ id: "conn-healthy" });

  it.each([
    {
      case: "a provider the registry does not know",
      break: () =>
        registry.getPageProvider.mockImplementation((name: string) => {
          if (name === "gone") throw new Error("Unknown provider: gone");
          return provider;
        }),
      brokenConnection: connection({ id: "conn-broken", provider: "gone" }),
    },
    {
      case: "a credential that will not decrypt",
      break: () =>
        crypto.decryptApiKey.mockImplementation((token: string) => {
          if (token === "rotated-key") throw new Error("bad ciphertext");
          return "plain-token";
        }),
      brokenConnection: connection({
        id: "conn-broken",
        accessTokenEncrypted: "rotated-key",
      }),
    },
    {
      case: "a poll the provider rejects",
      break: () => {
        crypto.decryptApiKey.mockImplementation((token: string) =>
          token === "revoked" ? "revoked" : "plain-token",
        );
        const pages = [{ id: "page-a" }];
        provider.pollModifiedPages.mockImplementation(async (token: string) => {
          if (token === "revoked") throw new Error("401 from provider");
          return pages;
        });
      },
      brokenConnection: connection({
        id: "conn-broken",
        accessTokenEncrypted: "revoked",
      }),
    },
  ])("$case costs that connection and nothing else", async (scenario) => {
    owed([scenario.brokenConnection, healthy]);
    sources({ id: "src-a", externalId: "page-a" });
    modified("page-a");

    scenario.break();

    const { totals } = await runSyncHop(LEASE);

    expect(totals.connectionsFailed).toBe(1);
    expect(totals.polled).toBe(1);
    expect(totals.marked).toBe(1);
    expect(writtenTo("conn-healthy")).toMatchObject({ lastPolledAt: NOW });
  });

  it("KF5: names the connection and its provider in the log", async () => {
    provider.pollModifiedPages.mockRejectedValue(
      new Error("401 from provider"),
    );
    owed([connection({ id: "conn-broken", provider: "notion" })]);
    sources({ id: "src-a", externalId: "page-a" });

    await runSyncHop(LEASE);

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("conn-broken"),
      expect.any(Error),
    );
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("notion"),
      expect.any(Error),
    );
  });

  it("does not count a failed poll's sources as anything", async () => {
    provider.pollModifiedPages.mockRejectedValue(
      new Error("401 from provider"),
    );
    owed([broken]);
    sources({ id: "src-a", externalId: "page-a" });

    const { totals } = await runSyncHop(LEASE);

    expect(db.notebookSource.updateMany).not.toHaveBeenCalled();
    expect(totals).toMatchObject({ marked: 0, unchanged: 0 });
  });
});

describe("KW2/KF2/KF3/KF4: what an attempt writes down", () => {
  it("KW2: a failed poll leaves the watermark where it was", async () => {
    provider.pollModifiedPages.mockRejectedValue(new Error("provider down"));
    owed([connection({ lastPolledAt: new Date(NOW.getTime() - 3 * DAY) })]);
    sources({ id: "src-a", externalId: "page-a" });

    await runSyncHop(LEASE);

    expect(writtenTo("conn-1")).not.toHaveProperty("lastPolledAt");
  });

  it("KF2: a failed poll still moves the attempt timestamp", async () => {
    provider.pollModifiedPages.mockRejectedValue(new Error("provider down"));
    owed([connection()]);
    sources({ id: "src-a", externalId: "page-a" });

    await runSyncHop(LEASE);

    expect(writtenTo("conn-1")).toMatchObject({
      lastAttemptedAt: NOW,
      consecutiveFailures: 1,
    });
  });

  it.each([
    { failures: 0, case: "nothing for the first failure", expected: 0 },
    { failures: 1, case: "nothing for the second", expected: 0 },
    { failures: 2, case: "6h once the third lands", expected: 6 * HOUR },
    { failures: 3, case: "24h for the fourth", expected: DAY },
    { failures: 4, case: "72h for the fifth", expected: 3 * DAY },
    {
      failures: 8,
      case: "capped at 7 days however long it stays broken",
      expected: 7 * DAY,
    },
  ])(
    "KF3: backs a failing connection off — $case",
    async ({ failures, expected }) => {
      provider.pollModifiedPages.mockRejectedValue(new Error("provider down"));
      owed([connection({ consecutiveFailures: failures })]);
      sources({ id: "src-a", externalId: "page-a" });

      await runSyncHop(LEASE);

      expect(writtenTo("conn-1")).toMatchObject({
        consecutiveFailures: failures + 1,
        nextPollAfter:
          expected === 0 ? null : new Date(NOW.getTime() + expected),
      });
    },
  );

  it("KF3: the backoff table is what the counter indexes into", () => {
    expect(backoffMs(0)).toBe(0);
    expect(backoffMs(3)).toBe(6 * HOUR);

    expect(backoffMs(99)).toBe(7 * DAY);
  });

  it("KF4: any success clears the backoff and the failure count", async () => {
    owed([connection({ consecutiveFailures: 4 })]);
    sources({ id: "src-a", externalId: "page-a" });

    await runSyncHop(LEASE);

    expect(writtenTo("conn-1")).toEqual({
      lastPolledAt: NOW,
      lastAttemptedAt: NOW,
      consecutiveFailures: 0,
      nextPollAfter: null,
    });
  });

  it("KW3: a connection the hop never reached keeps its watermark", async () => {
    const unreached = connection({ id: "conn-later" });
    owed([connection()], [unreached]);
    sources({ id: "src-a", externalId: "page-a" });

    await runSyncHop(LEASE);

    expect(writtenTo("conn-later")).toBeUndefined();
  });
});

describe("KR1/KR3: what the run marks and what it reports", () => {
  beforeEach(() => {
    owed([connection()]);
    sources(
      { id: "src-a", externalId: "page-a" },
      { id: "src-b", externalId: "page-b" },
      { id: "src-c", externalId: "page-c" },
    );
  });

  it("KR1: marks only the sources the provider reported as modified", async () => {
    modified("page-b");

    const { totals } = await runSyncHop(LEASE);

    expect(markedStale()).toEqual(["src-b"]);
    expect(totals).toMatchObject({ marked: 1, unchanged: 2 });
  });

  it("KR1: marks nothing when the provider reports no changes", async () => {
    modified();

    const { totals } = await runSyncHop(LEASE);

    expect(db.notebookSource.updateMany).not.toHaveBeenCalled();
    expect(totals).toMatchObject({ polled: 1, marked: 0, unchanged: 3 });
  });

  it("KR3: marks a connection's whole changed set in one write", async () => {
    modified("page-a", "page-b", "page-c");

    const { totals } = await runSyncHop(LEASE);

    expect(db.notebookSource.updateMany).toHaveBeenCalledTimes(1);
    expect(markedStale()).toEqual(["src-a", "src-b", "src-c"]);
    expect(totals).toMatchObject({ marked: 3, unchanged: 0 });
  });

  it("KR3: leaves the mark for the ingest to clear, changing nothing else", async () => {
    modified("page-a");

    await runSyncHop(LEASE);

    const [args] = db.notebookSource.updateMany.mock.calls[0];
    expect(args.data).toEqual({ staleAt: NOW });
  });
});

describe("KC2/KC3: the singleton lease", () => {
  it("takes the lease when the one on record is stale", async () => {
    db.integrationSyncLease.updateMany.mockResolvedValue({ count: 1 });

    const lease = await acquireSyncLease();

    expect(lease).toMatchObject({ hops: 0, token: expect.any(String) });
    expect(db.integrationSyncLease.create).not.toHaveBeenCalled();
    const [args] = db.integrationSyncLease.updateMany.mock.calls[0];
    expect(args.where.heartbeatAt.lt).toBeInstanceOf(Date);
  });

  it("takes the lease when no chain has ever run", async () => {
    db.integrationSyncLease.updateMany.mockResolvedValue({ count: 0 });

    expect(await acquireSyncLease()).toMatchObject({ hops: 0 });
    expect(db.integrationSyncLease.create).toHaveBeenCalledTimes(1);
  });

  it("refuses a second trigger while a live chain holds the lease", async () => {
    db.integrationSyncLease.updateMany.mockResolvedValue({ count: 0 });
    db.integrationSyncLease.create.mockRejectedValue(uniqueViolation());

    expect(await acquireSyncLease()).toBeNull();
  });

  it("surfaces a database failure rather than silently declining to run", async () => {
    db.integrationSyncLease.updateMany.mockResolvedValue({ count: 0 });
    db.integrationSyncLease.create.mockRejectedValue(
      new Error("connection lost"),
    );

    await expect(acquireSyncLease()).rejects.toThrow("connection lost");
  });

  it("KC4: a hop reads the chain's start instant from the row, not from its caller", async () => {
    db.integrationSyncLease.updateMany.mockResolvedValue({ count: 1 });

    const lease = await continueSyncLease("lease-token");

    expect(lease).toEqual({
      token: "lease-token",
      chainStartedAt: CHAIN_STARTED_AT,
      hops: 1,
    });
    const [args] = db.integrationSyncLease.updateMany.mock.calls[0];
    expect(args.data.hops).toEqual({ increment: 1 });
  });

  it.each([
    {
      case: "its token was taken over or released",
      held: { count: 0 },
      row: null,
    },
    {
      case: "another chain took the row between the update and the read",
      held: { count: 1 },
      row: {
        token: "someone-elses",
        chainStartedAt: CHAIN_STARTED_AT,
        hops: 1,
      },
    },
  ])("stops a hop whose $case", async ({ held, row }) => {
    db.integrationSyncLease.updateMany.mockResolvedValue(held);
    db.integrationSyncLease.findUnique.mockResolvedValue(row);

    expect(await continueSyncLease("lease-token")).toBeNull();
  });

  it("KC3: releasing expires the lease rather than deleting the row", async () => {
    await releaseSyncLease(LEASE);

    expect(db.integrationSyncLease.updateMany).toHaveBeenCalledWith({
      where: { id: "singleton", token: LEASE.token },
      data: { heartbeatAt: new Date(0) },
    });
  });
});

describe("KC1/KC5/KC6: how a chain ends", () => {
  it("hands the lease to a fresh invocation while a connection is still owed", async () => {
    owed([connection()], [connection({ id: "conn-later" })]);
    sources({ id: "src-a", externalId: "page-a" });

    const { continued } = await runSyncHop(LEASE);

    expect(continued).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      routes.app.api.cron.syncIntegrations,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ token: LEASE.token }),
      }),
    );
  });

  it.each([
    { case: "nothing was owed when it started", batch: [] },
    { case: "it reached the last connection owed", batch: [connection()] },
  ])("KC5: stops and releases the lease when $case", async ({ batch }) => {
    owed(batch, []);
    sources({ id: "src-a", externalId: "page-a" });

    const { continued } = await runSyncHop(LEASE);

    expect(continued).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(db.integrationSyncLease.updateMany).toHaveBeenCalledWith({
      where: { id: "singleton", token: LEASE.token },
      data: { heartbeatAt: new Date(0) },
    });
  });

  it("KC6: hands off mid-batch when a connection turns out to be pathologically slow", async () => {
    owed([connection({ id: "conn-slow" }), connection({ id: "conn-next" })]);
    sources({ id: "src-a", externalId: "page-a" });
    provider.pollModifiedPages.mockImplementation(async () => {
      vi.advanceTimersByTime(SYNC_HOP_DEADLINE_MS + 1_000);
      return [];
    });

    const { continued } = await runSyncHop(LEASE);

    expect(continued).toBe(true);
    expect(writtenTo("conn-next")).toBeUndefined();

    expect(db.integrationConnection.findMany).toHaveBeenCalledTimes(1);
  });

  it("KC5: stops loudly at the runaway backstop rather than chaining forever", async () => {
    const { totals, continued } = await runSyncHop({
      ...LEASE,
      hops: MAX_SYNC_HOPS,
    });

    expect(continued).toBe(false);
    expect(totals.polled).toBe(0);
    expect(db.integrationConnection.findMany).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("MAX_SYNC_HOPS"),
    );
  });

  it("drops the lease when the hop itself fails, rather than letting it expire", async () => {
    db.integrationConnection.findMany.mockRejectedValue(new Error("db gone"));

    const { continued } = await runSyncHop(LEASE);

    expect(continued).toBe(false);
    expect(db.integrationSyncLease.updateMany).toHaveBeenCalledWith({
      where: { id: "singleton", token: LEASE.token },
      data: { heartbeatAt: new Date(0) },
    });
  });

  it("does not lose the remaining connections when the handoff cannot be delivered", async () => {
    owed([connection()], [connection({ id: "conn-later" })]);
    sources({ id: "src-a", externalId: "page-a" });
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));

    const { continued } = await runSyncHop(LEASE);

    expect(continued).toBe(true);
    expect(writtenTo("conn-later")).toBeUndefined();
  });
});
