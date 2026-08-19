-- PIPE-1: track when a source was claimed into PROCESSING so a sweeper can
-- reclaim jobs whose fire-and-forget after() callback died mid-run.
ALTER TABLE "notebook_source" ADD COLUMN IF NOT EXISTS "processingStartedAt" TIMESTAMP(3);
