ALTER TABLE "scene_progress"
ADD COLUMN "attempt" INTEGER NOT NULL DEFAULT 1;

DROP INDEX IF EXISTS "scene_progress_enrollmentId_lessonId_sceneId_key";

CREATE UNIQUE INDEX IF NOT EXISTS "scene_progress_enrollmentId_lessonId_sceneId_attempt_key" ON "scene_progress"("enrollmentId", "lessonId", "sceneId", "attempt");
