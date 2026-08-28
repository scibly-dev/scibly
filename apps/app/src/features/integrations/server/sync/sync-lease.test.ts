import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  integrationSyncLease: {
    updateMany: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
  },
}));

vi.mock("@scibly/db", async () => {
  const client = await import("@scibly/db/client");
  return { db, Prisma: client.Prisma };
});

const prismaClient = await import("@scibly/db/client");
const { acquireSyncLease, continueSyncLease, releaseSyncLease } =
  await import("./sync-lease");

const CHAIN_STARTED_AT = new Date("2026-07-27T02:59:00.000Z");
const LEASE = {
  token: "lease-token",
  chainStartedAt: CHAIN_STARTED_AT,
  hops: 0,
};

function uniqueViolation() {
  return new prismaClient.Prisma.PrismaClientKnownRequestError(
    "Unique constraint failed",
    { code: "P2002", clientVersion: "7.8.0" },
  );
}

beforeEach(() => {
  vi.resetAllMocks();

  db.integrationSyncLease.updateMany.mockResolvedValue({ count: 1 });
  db.integrationSyncLease.create.mockResolvedValue({ id: "singleton" });
  // The row a hop reads back is the row its own update just wrote.
  db.integrationSyncLease.findUnique.mockImplementation(async () => ({
    token: rotatedTo(),
    chainStartedAt: CHAIN_STARTED_AT,
    hops: 1,
  }));
});

function rotatedTo(): string {
  const [args] = db.integrationSyncLease.updateMany.mock.calls[0];
  return args.data.token;
}

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
      token: rotatedTo(),
      chainStartedAt: CHAIN_STARTED_AT,
      hops: 1,
    });
    const [args] = db.integrationSyncLease.updateMany.mock.calls[0];
    expect(args.data.hops).toEqual({ increment: 1 });
  });

  it("KC2: spends the token, so a duplicated handoff cannot run a second hop", async () => {
    const first = await continueSyncLease("lease-token");

    expect(first?.token).not.toBe("lease-token");
    // The row no longer answers to the token the duplicate is carrying.
    db.integrationSyncLease.updateMany.mockResolvedValue({ count: 0 });
    expect(await continueSyncLease("lease-token")).toBeNull();
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
      data: { token: expect.any(String), heartbeatAt: new Date(0) },
    });
    // And not to the token it was released with.
    expect(rotatedTo()).not.toBe(LEASE.token);
  });
});
