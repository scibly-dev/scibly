-- Issue #68: a failed payment starts a 14-day grace period.
--
-- `status` says an organization is past due but not since when, so the grace
-- period had no start to count from (PL1). This column is that start: written
-- once when the subscription enters PAST_DUE, cleared whenever it leaves.
ALTER TABLE "organization_subscription"
  ADD COLUMN "pastDueSince" TIMESTAMP(3);

-- Organizations already mid-dunning get their full fourteen days from this
-- deploy (PL6). Without the backfill they would sit in the null case forever,
-- which PL5 reads as an unbounded grace period.
UPDATE "organization_subscription"
  SET "pastDueSince" = now()
  WHERE "status" = 'PAST_DUE';
