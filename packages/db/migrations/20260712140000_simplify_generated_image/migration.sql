-- Add toolCallId for idempotent generation retries
ALTER TABLE "notebook_generated_image" ADD COLUMN IF NOT EXISTS "toolCallId" TEXT;

-- Drop unused async status scaffolding if present from prior db push
ALTER TABLE "notebook_generated_image" DROP COLUMN IF EXISTS "status";
DROP TYPE IF EXISTS "notebook_generated_image_status";

-- Unique constraint for toolCallId idempotency per notebook
CREATE UNIQUE INDEX IF NOT EXISTS "notebook_generated_image_notebookId_toolCallId_key"
  ON "notebook_generated_image"("notebookId", "toolCallId");
