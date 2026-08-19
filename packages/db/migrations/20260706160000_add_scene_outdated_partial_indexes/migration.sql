-- INV-12: partial indexes for the hot "outdated draft scenes for a course"
-- and "scenes suggested for deletion" queries. Partial indexes can't be
-- expressed in schema.prisma, hence the raw migration.
-- CreateIndex
CREATE INDEX "scene_outdated_draft_idx" ON "scene"("lessonId") WHERE "isOutdated" = true AND "courseVersionId" IS NULL;

-- CreateIndex
CREATE INDEX "scene_suggested_deletion_draft_idx" ON "scene"("lessonId") WHERE "suggestedForDeletion" = true AND "courseVersionId" IS NULL;
