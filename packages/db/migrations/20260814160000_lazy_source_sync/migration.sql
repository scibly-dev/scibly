-- The freshness poll no longer re-ingests, it only marks: `staleAt` is that
-- mark, and the ingestion that opening the notebook triggers clears it.
ALTER TABLE "notebook_source" ADD COLUMN "staleAt" TIMESTAMP(3);

-- The drain that probed this index globally is gone. What is left asks for
-- PENDING sources of one notebook, which "notebook_source_notebookId_idx"
-- already covers.
DROP INDEX IF EXISTS "notebook_source_pending_idx";

-- DropTable
DROP TABLE IF EXISTS "ingestion_drain_lease";
