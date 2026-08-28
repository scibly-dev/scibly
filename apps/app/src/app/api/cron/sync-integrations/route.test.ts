import type * as NextServer from "next/server";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { cronRequest, runDeferredWork } from "../testing";

// Auth is covered in cron-route-guard.test.ts and the sync run in the sync-source-freshness
// suite; this suite only tests what the route itself decides — chaining, response-before-work,
// and failure messages.

const sync = vi.hoisted(() => ({
  acquireSyncLease: vi.fn(),
  continueSyncLease: vi.fn(),
  runSyncHop: vi.fn(),
}));

const env = vi.hoisted(() => ({ CRON_SECRET: "test-cron-secret" }));
const afterMock = vi.hoisted(() => vi.fn());

vi.mock("@/env", () => ({ env }));
vi.mock("@/features/integrations/server", () => sync);
vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof NextServer>();
  return { ...actual, after: afterMock };
});

const { GET, POST } = await import("./route");

const ROUTE_URL = "https://app.test/api/cron/sync-integrations";
const SECRET = "test-cron-secret";
const LEASE = { token: "lease-token", chainStartedAt: new Date(), hops: 0 };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  env.CRON_SECRET = SECRET;
  sync.acquireSyncLease.mockResolvedValue(LEASE);
  sync.continueSyncLease.mockResolvedValue(LEASE);
  sync.runSyncHop.mockResolvedValue({ totals: {}, continued: false });
});

describe("KD4: the route is behind the shared door", () => {
  it.each([
    { name: "GET", handler: GET },
    { name: "POST", handler: POST },
  ])(
    "$name refuses a caller presenting the wrong secret",
    async ({ handler }) => {
      const response = await handler(
        cronRequest(ROUTE_URL, { method: "GET", secret: "wrong-secret" }),
      );

      expect(response.status).toBe(401);
      expect(sync.acquireSyncLease).not.toHaveBeenCalled();
      expect(sync.continueSyncLease).not.toHaveBeenCalled();
      expect(afterMock).not.toHaveBeenCalled();
    },
  );

  it("refuses a caller presenting no secret at all", async () => {
    const response = await GET(cronRequest(ROUTE_URL, { method: "GET" }));

    expect(response.status).toBe(401);
    expect(afterMock).not.toHaveBeenCalled();
  });

  it("fails closed when the deployment has no secret configured", async () => {
    env.CRON_SECRET = "";

    const response = await GET(
      cronRequest(ROUTE_URL, { method: "GET", secret: "anything" }),
    );

    expect(response.status).toBe(500);
    expect(sync.acquireSyncLease).not.toHaveBeenCalled();
  });
});

describe("KD5: a run that cannot start", () => {
  it.each([
    { name: "GET", handler: GET },
    { name: "POST", handler: POST },
  ])(
    "$name answers 500 without naming a provider or a connection",
    async ({ handler }) => {
      sync.acquireSyncLease.mockRejectedValue(
        new Error("connect ECONNREFUSED db.internal:5432 for org acme"),
      );

      const response = await handler(
        cronRequest(ROUTE_URL, { method: "GET", secret: SECRET }),
      );

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ error: "Sync failed" });
    },
  );
});

describe("KC2: exactly one chain at a time", () => {
  it.each([
    { name: "the daily cron", handler: GET },
    { name: "a fresh kick", handler: POST },
  ])(
    "$name joins the running chain rather than starting a second",
    async ({ handler }) => {
      sync.acquireSyncLease.mockResolvedValue(null);

      const response = await handler(
        cronRequest(ROUTE_URL, { method: "GET", secret: SECRET }),
      );

      expect(await response.json()).toEqual({ ok: true, joined: true });
      expect(afterMock).not.toHaveBeenCalled();
      expect(sync.runSyncHop).not.toHaveBeenCalled();
    },
  );

  it("stops a hop whose token is no longer the chain's", async () => {
    sync.continueSyncLease.mockResolvedValue(null);

    const response = await POST(
      cronRequest(ROUTE_URL, {
        method: "POST",
        secret: SECRET,
        body: { token: "stale" },
      }),
    );

    expect(await response.json()).toEqual({ ok: true, joined: true });
    expect(afterMock).not.toHaveBeenCalled();
  });
});

describe("the chain's hops", () => {
  it("continues on the token its predecessor held rather than taking a new lease", async () => {
    const response = await POST(
      cronRequest(ROUTE_URL, {
        method: "POST",
        secret: SECRET,
        body: { token: "lease-token" },
      }),
    );

    expect(response.status).toBe(200);
    expect(sync.continueSyncLease).toHaveBeenCalledWith("lease-token");
    expect(sync.acquireSyncLease).not.toHaveBeenCalled();
  });

  it("treats a kick carrying no token as a cold start", async () => {
    await POST(cronRequest(ROUTE_URL, { method: "POST", secret: SECRET }));

    expect(sync.acquireSyncLease).toHaveBeenCalledTimes(1);
    expect(sync.continueSyncLease).not.toHaveBeenCalled();
  });

  it("answers before it polls anything, so the predecessor is not held open", async () => {
    const response = await GET(
      cronRequest(ROUTE_URL, { method: "GET", secret: SECRET }),
    );

    expect(await response.json()).toEqual({ ok: true, started: true });
    expect(sync.runSyncHop).not.toHaveBeenCalled();

    await runDeferredWork(afterMock);
    expect(sync.runSyncHop).toHaveBeenCalledWith(LEASE);
  });
});
