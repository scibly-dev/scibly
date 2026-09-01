-- Triage or extraction that exhausted its retries. Not terminal: the content is
-- kept and the nightly sweep sends the bundle round again. Added, never used,
-- in this transaction — Postgres only forbids the latter.
ALTER TYPE "knowledge_bundle_outcome" ADD VALUE IF NOT EXISTS 'FAILED';

ALTER TABLE "knowledge_bundle" ADD COLUMN "failureReason" TEXT;

-- How many times the funnel has picked this bundle up. The nightly sweep stops
-- at a ceiling, so a bundle that fails the same way every night is settled
-- instead of retried and re-charged forever.
ALTER TABLE "knowledge_bundle" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;

-- The nightly sweep looks across every organization, so the org-leading index
-- cannot serve it. Partial, matching the sweep's predicate exactly.
CREATE INDEX "knowledge_bundle_stranded_idx"
  ON "knowledge_bundle" ("collectedAt")
  WHERE "processedAt" IS NULL AND "discardReason" IS NULL AND "content" IS NOT NULL;
