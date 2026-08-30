-- AlterTable
ALTER TABLE "integration_connection" ADD COLUMN "knowledgeDestinationPageId" TEXT;

-- AlterTable
ALTER TABLE "knowledge_topic"
    ADD COLUMN "markdown" TEXT NOT NULL DEFAULT '',
    ADD COLUMN "notionPageId" TEXT,
    ADD COLUMN "notionRevisionAt" TIMESTAMP(3),
    ADD COLUMN "documentHash" TEXT,
    ADD COLUMN "publishedAt" TIMESTAMP(3),
    ADD COLUMN "verifiedAt" TIMESTAMP(3),
    ADD COLUMN "externallyEditedAt" TIMESTAMP(3);
