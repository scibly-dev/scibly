-- PIPE-9: enforce external-page dedup at the DB level. Postgres treats rows
-- with any NULL column as distinct for uniqueness purposes, so this has no
-- effect on non-integration sources (externalId/integrationId are both null).
-- CreateIndex
CREATE UNIQUE INDEX "notebook_source_notebookId_integrationId_externalId_key" ON "notebook_source"("notebookId", "integrationId", "externalId");
