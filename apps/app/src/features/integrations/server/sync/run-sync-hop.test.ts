import { routes } from "@scibly/routes";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SOURCE_STATUS } from "@/shared/content/sources/constants";

const db = vi.hoisted(() => ({
  integrationConnection: { findMany: vi.fn(), updateMany: vi.fn() },
  notebookSource: { findMany: vi.fn(), updateMany: vi.fn() },
  integrationSyncLease: { updateMany: vi.fn() },
  $transaction: vi.fn(),
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

const { SYNC_CLOCK_SKEW_MS, SYNC_HOP_CONNECTION_LIMIT } =
  await import("./poll-connection");
const { MAX_SYNC_HOPS, runSyncHop, SYNC_HOP_DEADLINE_MS } =
  await import("./run-sync-hop");

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

// A hop asks once, for one connection more than it can poll; anything past
// that limit is the surplus that tells it the chain still owes work.
function owed(batch: Connection[], surplus: Connection[] = []): void {
  db.integrationConnection.findMany.mockResolvedValue([...batch, ...surplus]);
}

// The shape that makes a hop hand the chain on: as much work as it can take,
// and one more connection it will not reach.
function owedPastTheLimit(unreached: Connection): void {
  owed(
    Array.from({ length: SYNC_HOP_CONNECTION_LIMIT }, (_, index) =>
      connection({ id: `conn-${index}` }),
    ),
    [unreached],
  );
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
  const call = db.integrationConnection.updateMany.mock.calls.find(
    ([args]) => args.where.id === connectionId,
  );
  return call?.[0].data;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers({ now: NOW });
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.stubGlobal("fetch", fetchMock);

  fetchMock.mockResolvedValue({ ok: true });
  db.integrationConnection.findMany.mockResolvedValue([]);
  db.integrationConnection.updateMany.mockResolvedValue({ count: 1 });
  // The batched writes are handed over as promises the caller already started,
  // so the doubled transaction is just the settle.
  db.$transaction.mockImplementation(async (ops: Promise<unknown>[]) =>
    Promise.all(ops),
  );
  db.notebookSource.findMany.mockResolvedValue([]);
  db.notebookSource.updateMany.mockImplementation(
    async ({ where }: { where: { id: { in: string[] } } }) => ({
      count: where.id.in.length,
    }),
  );
  db.integrationSyncLease.updateMany.mockResolvedValue({ count: 1 });
  registry.getProvider.mockReturnValue(provider);
  registry.getPageProvider.mockReturnValue(provider);
  crypto.decryptApiKey.mockReturnValue("plain-token");
  provider.pollModifiedPages.mockResolvedValue([]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("KW1/KW4/KW5: the interval a poll covers", () => {
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

describe("KB1/KB2/KB3/KB4: organizations that can pay for what a poll leads to", () => {
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
      // The plateau stays inside the window a returning poll can still cover.
      failures: 8,
      case: "capped at 3 days however long it stays broken",
      expected: 3 * DAY,
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
    owedPastTheLimit(connection({ id: "conn-later" }));
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

describe("KC1/KC5/KC6: how a chain ends", () => {
  it("hands the lease to a fresh invocation while a connection is still owed", async () => {
    owedPastTheLimit(connection({ id: "conn-later" }));
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

  it("asks which connections are owed once per hop, not once per decision", async () => {
    owedPastTheLimit(connection({ id: "conn-later" }));
    sources({ id: "src-a", externalId: "page-a" });

    const { continued } = await runSyncHop(LEASE);

    expect(continued).toBe(true);
    expect(db.integrationConnection.findMany).toHaveBeenCalledTimes(1);
  });

  it("polls no more than a hop's worth, however many the query returns", async () => {
    owedPastTheLimit(connection({ id: "conn-later" }));
    sources({ id: "src-a", externalId: "page-a" });

    const { totals } = await runSyncHop(LEASE);

    expect(totals.polled).toBe(SYNC_HOP_CONNECTION_LIMIT);
    const [args] = db.integrationConnection.findMany.mock.calls[0];
    expect(args.take).toBe(SYNC_HOP_CONNECTION_LIMIT + 1);
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

  it.each([
    {
      case: "the request never lands",
      arrange: () => fetchMock.mockRejectedValue(new Error("ECONNREFUSED")),
    },
    {
      case: "the next hop refuses it",
      arrange: () => fetchMock.mockResolvedValue({ ok: false, status: 401 }),
    },
  ])(
    "gives the lease back when the handoff fails because $case",
    async ({ arrange }) => {
      owedPastTheLimit(connection({ id: "conn-later" }));
      sources({ id: "src-a", externalId: "page-a" });
      arrange();

      const { continued } = await runSyncHop(LEASE);

      // No hop is coming, so the next scheduled run must be free to start one.
      expect(continued).toBe(false);
      expect(db.integrationSyncLease.updateMany).toHaveBeenCalledWith({
        where: { id: "singleton", token: LEASE.token },
        data: { heartbeatAt: new Date(0) },
      });
      expect(writtenTo("conn-later")).toBeUndefined();
    },
  );
});
