-- Triage or extraction that exhausted its retries. Not terminal: the content is
-- kept and the nightly sweep sends the bundle round again. Added, never used,
-- in this transaction — Postgres only forbids the latter.
ALTER TYPE "knowledge_bundle_outcome" ADD VALUE IF NOT EXISTS 'FAILED';

ALTER TABLE "knowledge_bundle" ADD COLUMN "failureReason" TEXT;
