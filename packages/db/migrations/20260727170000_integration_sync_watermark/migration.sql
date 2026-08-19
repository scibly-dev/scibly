-- KW1/KW2: the scheduled refresh's watermark. `lastPolledAt` advances only
-- when a poll actually succeeded and decides the window the next poll covers,
-- so a failed, skipped or deploy-interrupted run costs delay rather than the
-- interval's changes. `lastAttemptedAt` advances on every attempt and decides
-- selection, which is what lets a chain terminate: an integration that can
-- never succeed would otherwise stay owed forever (KF2/KC4).
--
-- Both start null. KW4: a connection with no watermark polls the 7-day floor,
-- which is safe because sources are ingested at connect time and their content
-- is already current.
-- AlterTable
ALTER TABLE "integration_connection" ADD COLUMN "lastPolledAt" TIMESTAMP(3);
ALTER TABLE "integration_connection" ADD COLUMN "lastAttemptedAt" TIMESTAMP(3);
ALTER TABLE "integration_connection" ADD COLUMN "consecutiveFailures" INTEGER NOT NULL DEFAULT 0;

-- KF3: the backoff gate, written at failure time from `consecutiveFailures`.
-- A column rather than a computed predicate because the delay is per-row and a
-- backed-off connection has to be excluded by the query — a chain that merely
-- skipped it in memory would keep re-selecting it and never terminate.
ALTER TABLE "integration_connection" ADD COLUMN "nextPollAfter" TIMESTAMP(3);

-- KS2: least-recently-attempted first, so the per-run bound is a delay and
-- never a starvation line.
-- CreateIndex
CREATE INDEX "integration_connection_lastAttemptedAt_idx" ON "integration_connection"("lastAttemptedAt");

-- KS5: the run selects one integration's syncable sources. Without this it
-- sequentially scans the largest table in the product, once per connection,
-- every run.
-- CreateIndex
CREATE INDEX "notebook_source_integrationId_status_idx" ON "notebook_source"("integrationId", "status");

-- KC2: singleton lease guarding the scheduled refresh. Two chains polling the
-- same connection would double the provider quota and race the same watermark.
-- CreateTable
-- KC4: `chainStartedAt` is the termination condition — a connection attempted
-- at or after it has had its turn in this chain. KC5: `hops` is a runaway
-- backstop, not the design.
CREATE TABLE "integration_sync_lease" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "heartbeatAt" TIMESTAMP(3) NOT NULL,
    "chainStartedAt" TIMESTAMP(3) NOT NULL,
    "hops" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "integration_sync_lease_pkey" PRIMARY KEY ("id")
);
