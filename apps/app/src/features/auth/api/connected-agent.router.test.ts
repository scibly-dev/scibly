import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  oauthAccessToken: { findMany: vi.fn(), deleteMany: vi.fn() },
  oauthConsent: { deleteMany: vi.fn() },
  $transaction: vi.fn(async (ops: unknown[]) => ops),
}));

vi.mock("@scibly/db", () => ({ db }));

// Imported dynamically — a static import would pull `@scibly/db` in above the
// double, closing over an uninitialised `db`.
const { createCallerFactory } = await import("@scibly/api/trpc");
const { db: prisma } = await import("@scibly/db");
const { connectedAgentRouter } = await import("./connected-agent.router");

const USER_ID = "user-1";
const OTHER_USER_ID = "user-2";

function caller(userId = USER_ID) {
  const now = new Date("2026-01-01T00:00:00Z");
  return createCallerFactory(connectedAgentRouter)({
    db: prisma,
    headers: new Headers(),
    locale: "en",
    correlationId: "corr-1",
    actor: { userId },
    session: {
      user: {
        id: userId,
        name: "Author",
        email: "author@example.test",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
    },
  });
}

function grant(overrides: Partial<{ clientId: string; name: string }> = {}) {
  return {
    clientId: overrides.clientId ?? "client-1",
    createdAt: new Date("2026-02-01T00:00:00Z"),
    application: {
      name: overrides.name ?? "Some Agent",
      redirectUrls: "https://agent.test/callback",
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  db.oauthAccessToken.findMany.mockResolvedValue([]);
});

describe("showing a user which agents can act as them", () => {
  it("names the agent and where its code goes", async () => {
    db.oauthAccessToken.findMany.mockResolvedValue([grant()]);

    expect(await caller().list()).toEqual([
      {
        clientId: "client-1",
        name: "Some Agent",
        destinations: ["https://agent.test"],
        connectedAt: new Date("2026-02-01T00:00:00Z"),
      },
    ]);
  });

  it("asks only for this user's live grants, one row per agent", async () => {
    await caller().list();

    const args = db.oauthAccessToken.findMany.mock.calls[0]![0] as {
      where: { userId: string; refreshTokenExpiresAt: { gt: Date } };
      distinct: string[];
      orderBy: { createdAt: string };
    };
    expect(args.where.userId).toBe(USER_ID);
    expect(args.where.refreshTokenExpiresAt.gt).toBeInstanceOf(Date);
    expect(args.distinct).toEqual(["clientId"]);
    expect(args.orderBy).toEqual({ createdAt: "desc" });
  });
});

describe("cutting off an agent", () => {
  it("drops the tokens and the standing consent together", async () => {
    await caller().revoke({ clientId: "client-1" });

    expect(db.oauthAccessToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: USER_ID, clientId: "client-1" },
    });
    expect(db.oauthConsent.deleteMany).toHaveBeenCalledWith({
      where: { userId: USER_ID, clientId: "client-1" },
    });
    expect(db.$transaction).toHaveBeenCalledOnce();
  });

  it("cannot reach another user's grant, whatever client id is named", async () => {
    await caller(OTHER_USER_ID).revoke({ clientId: "client-1" });

    expect(db.oauthAccessToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: OTHER_USER_ID, clientId: "client-1" },
    });
  });

  it("refuses an empty client id", async () => {
    await expect(caller().revoke({ clientId: "" })).rejects.toThrow();
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});
