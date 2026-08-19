-- Add type enum for AI models (idempotent)
DO $$ BEGIN
  CREATE TYPE "OrganizationAIModelType" AS ENUM ('CHAT', 'EMBEDDING');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add new columns to organization_ai_model (idempotent)
ALTER TABLE "organization_ai_model"
  ADD COLUMN IF NOT EXISTS "type"        "OrganizationAIModelType" NOT NULL DEFAULT 'CHAT',
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "dimensions"  INTEGER,
  ADD COLUMN IF NOT EXISTS "isActive"    BOOLEAN NOT NULL DEFAULT true;

-- Add new source type enum values (idempotent)
ALTER TYPE "notebook_source_type" ADD VALUE IF NOT EXISTS 'NOTION_PAGE';
ALTER TYPE "notebook_source_type" ADD VALUE IF NOT EXISTS 'CONFLUENCE_PAGE';
ALTER TYPE "notebook_source_type" ADD VALUE IF NOT EXISTS 'SHAREPOINT_PAGE';

-- Add integration/sync fields to notebook_source (idempotent)
ALTER TABLE "notebook_source"
  ADD COLUMN IF NOT EXISTS "content"       TEXT,
  ADD COLUMN IF NOT EXISTS "error"         TEXT,
  ADD COLUMN IF NOT EXISTS "fileSize"      INTEGER,
  ADD COLUMN IF NOT EXISTS "pageCount"     INTEGER,
  ADD COLUMN IF NOT EXISTS "externalId"    TEXT,
  ADD COLUMN IF NOT EXISTS "externalUrl"   TEXT,
  ADD COLUMN IF NOT EXISTS "integrationId" TEXT,
  ADD COLUMN IF NOT EXISTS "lastSyncedAt"  TIMESTAMP(3);

-- Index for fast org-scoped model lookups by type
CREATE INDEX IF NOT EXISTS "organization_ai_model_organizationId_type_idx"
  ON "organization_ai_model"("organizationId", "type");

-- IVFFlat index for approximate nearest-neighbor cosine search on embeddings
-- lists=100 is suitable for up to ~1M rows; tune as dataset grows
CREATE INDEX IF NOT EXISTS "notebook_source_chunk_embedding_idx"
  ON "notebook_source_chunk" USING ivfflat ("embedding" vector_cosine_ops)
  WITH (lists = 100);
