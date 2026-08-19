import type { SceneOutdatedReason } from "@scibly/db/client";

import { db, type Prisma } from "@scibly/db";

export async function invalidateScenesForSource(
  sourceId: string,
  tx: Prisma.TransactionClient | typeof db = db,
  reason: SceneOutdatedReason = "SOURCE_CHANGED",
): Promise<void> {
  await tx.scene.updateMany({
    where: { courseVersionId: null, sourceLineages: { some: { sourceId } } },
    data: { isOutdated: true, outdatedReason: reason },
  });
}

export async function flagScenesForSourceRemoval(
  sourceId: string,
  tx: Prisma.TransactionClient | typeof db = db,
): Promise<void> {
  await invalidateScenesForSource(sourceId, tx, "SOURCE_REMOVED");
}
