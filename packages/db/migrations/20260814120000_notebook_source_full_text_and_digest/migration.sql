-- Sources are now quoted into the chat prompt instead of retrieved as embedded
-- chunks, so `content` holds the full extracted text and `tokenCount` is what
-- the tier decision sums. Existing rows keep `tokenCount = 0`, which reads as
-- "content is still the old 10k truncation, do not inline it".
-- AlterTable
ALTER TABLE "notebook_source"
  ADD COLUMN "tokenCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "summary" TEXT,
  ADD COLUMN "outline" TEXT;

-- Tier 2 keyword search runs Postgres FTS over the raw text. Expression index,
-- so the two-arg (IMMUTABLE) form of to_tsvector is required. 'simple' because
-- the corpus is mixed German/English and wrong stemming is worse than none.
--
-- No CONCURRENTLY: Prisma runs each migration inside a transaction, where it is
-- illegal. The table is small; the brief lock is acceptable.
--
-- Size ceiling: a tsvector value cannot exceed 1MB. The worst case allowed by
-- MAX_WORDS_PER_SOURCE (50k) and MAX_CHARS_PER_SOURCE (500k) — every one of
-- 50k words distinct and 10 chars long — measures 900KB; ordinary prose of the
-- same length measures 7KB. Raising either cap needs this re-measured, or
-- ingestion writes start failing on the index expression.
-- CreateIndex
CREATE INDEX IF NOT EXISTS "notebook_source_content_fts_idx"
  ON "notebook_source" USING GIN (to_tsvector('simple', "content"));
