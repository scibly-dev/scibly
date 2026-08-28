import { TimeHelpers } from "@scibly/api/rate-limit";
import { db, Prisma } from "@scibly/db";

// One chain runs at a time: two would ask a provider twice for the same thing
// and race each other's watermarks.

const SYNC_LEASE_MS = TimeHelpers.IN_MS.MINUTE * 10;

const SYNC_LEASE_ID = "singleton";

export interface SyncLease {
  token: string;
  chainStartedAt: Date;
  hops: number;
}

export async function acquireSyncLease(): Promise<SyncLease | null> {
  const token = crypto.randomUUID();
  const chainStartedAt = new Date();
  const taken = await db.integrationSyncLease.updateMany({
    where: {
      id: SYNC_LEASE_ID,
      heartbeatAt: { lt: new Date(Date.now() - SYNC_LEASE_MS) },
    },
    data: { token, heartbeatAt: new Date(), chainStartedAt, hops: 0 },
  });
  if (taken.count > 0) return { token, chainStartedAt, hops: 0 };

  try {
    await db.integrationSyncLease.create({
      data: {
        id: SYNC_LEASE_ID,
        token,
        heartbeatAt: new Date(),
        chainStartedAt,
        hops: 0,
      },
    });
    return { token, chainStartedAt, hops: 0 };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return null;
    }
    throw error;
  }
}

export async function continueSyncLease(
  token: string,
): Promise<SyncLease | null> {
  const held = await db.integrationSyncLease.updateMany({
    where: { id: SYNC_LEASE_ID, token },
    data: { heartbeatAt: new Date(), hops: { increment: 1 } },
  });
  if (held.count === 0) return null;

  const row = await db.integrationSyncLease.findUnique({
    where: { id: SYNC_LEASE_ID },
    select: { token: true, chainStartedAt: true, hops: true },
  });
  if (!row || row.token !== token) return null;
  return { token, chainStartedAt: row.chainStartedAt, hops: row.hops };
}

export async function releaseSyncLease(lease: SyncLease): Promise<void> {
  await db.integrationSyncLease.updateMany({
    where: { id: SYNC_LEASE_ID, token: lease.token },
    data: { heartbeatAt: new Date(0) },
  });
}
