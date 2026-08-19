-- AlterTable
ALTER TABLE "notebook_source" ADD COLUMN "contentHash" TEXT;

-- AlterTable
ALTER TABLE "scene" ADD COLUMN "isOutdated" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "scene_source_lineage" (
    "id" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scene_source_lineage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scene_source_lineage_sourceId_idx" ON "scene_source_lineage"("sourceId");

-- CreateIndex
CREATE INDEX "scene_source_lineage_sceneId_idx" ON "scene_source_lineage"("sceneId");

-- CreateIndex
CREATE UNIQUE INDEX "scene_source_lineage_sceneId_sourceId_key" ON "scene_source_lineage"("sceneId", "sourceId");

-- AddForeignKey
ALTER TABLE "scene_source_lineage" ADD CONSTRAINT "scene_source_lineage_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_source_lineage" ADD CONSTRAINT "scene_source_lineage_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "notebook_source"("id") ON DELETE CASCADE ON UPDATE CASCADE;
