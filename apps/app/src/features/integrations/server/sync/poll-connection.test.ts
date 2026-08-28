import { notLapsedSubscription } from "@scibly/api/entitlement";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PAGE_INTEGRATION_PROVIDERS } from "@/features/integrations/contracts";

const db = vi.hoisted(() => ({
  integrationConnection: { findMany: vi.fn() },
}));

vi.mock("@scibly/db", async () => {
  const client = await import("@scibly/db/client");
  return { db, Prisma: client.Prisma };
});

const {
  backoffMs,
  getPollingStart,
  loadOwedConnections,
  SYNC_CLOCK_SKEW_MS,
  SYNC_HOP_CONNECTION_LIMIT,
  SYNC_WINDOW_FLOOR_MS,
} = await import("./poll-connection");

const NOW = new Date("2026-07-27T03:00:00.000Z");
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const CHAIN_STARTED_AT = new Date("2026-07-27T02:59:00.000Z");
const LEASE = {
  token: "lease-token",
  chainStartedAt: CHAIN_STARTED_AT,
  hops: 0,
};

beforeEach(() => {
  vi.resetAllMocks();

  db.integrationConnection.findMany.mockResolvedValue([]);
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
});

describe("KF3: the backoff ladder", () => {
  it("KF3: the backoff table is what the counter indexes into", () => {
    expect(backoffMs(0)).toBe(0);
    expect(backoffMs(3)).toBe(6 * HOUR);

    expect(backoffMs(99)).toBe(7 * DAY);
  });
});
