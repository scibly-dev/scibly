DROP INDEX IF EXISTS "scene_suggested_deletion_draft_idx";

ALTER TABLE "scene" DROP COLUMN IF EXISTS "suggestedForDeletion";
ALTER TABLE "scene" DROP COLUMN IF EXISTS "deletionReason";
