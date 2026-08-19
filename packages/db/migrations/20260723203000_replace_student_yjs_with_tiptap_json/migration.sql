-- Learner content is an immutable TipTap JSON snapshot produced during publish.
ALTER TABLE "scene"
ADD COLUMN "studentContent" JSONB,
ADD COLUMN "gradingManifest" JSONB,
DROP COLUMN "studentDocumentState";

-- Learner answers are persisted through analytics/progression records, not Yjs.
ALTER TABLE "scene_progress"
DROP COLUMN "documentState";
