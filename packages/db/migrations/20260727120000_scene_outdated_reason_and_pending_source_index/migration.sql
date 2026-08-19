-- SV5: a flagged draft scene records *why* it was flagged. A removed source
-- cannot be resolved by re-reading it, so the author has to be able to tell
-- the two apart.
-- CreateEnum
CREATE TYPE "scene_outdated_reason" AS ENUM ('SOURCE_CHANGED', 'SOURCE_REMOVED');

-- AlterTable
ALTER TABLE "scene" ADD COLUMN "outdatedReason" "scene_outdated_reason";

-- Existing flags predate the reason and were all raised by a content change.
UPDATE "scene" SET "outdatedReason" = 'SOURCE_CHANGED' WHERE "isOutdated" = true;

-- SL4/SL5: fencing token for the claim that owns the current PROCESSING run.
-- Every write a run makes is conditional on it, so a run whose claim was taken
-- over or reset underneath it lands nothing.
-- AlterTable
ALTER TABLE "notebook_source" ADD COLUMN "processingToken" TEXT;

-- SB6: PENDING is the ingestion queue. The drain and its cron backstop probe
-- it; in steady state the partial index holds no rows, so both the probe and
-- the index's own maintenance are free. Partial indexes can't be expressed in
-- schema.prisma, hence the raw migration.
-- CreateIndex
CREATE INDEX "notebook_source_pending_idx" ON "notebook_source"("id") WHERE "status" = 'PENDING';

-- SB3: singleton lease guarding the re-ingestion drain.
-- CreateTable
CREATE TABLE "ingestion_drain_lease" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "heartbeatAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingestion_drain_lease_pkey" PRIMARY KEY ("id")
);
