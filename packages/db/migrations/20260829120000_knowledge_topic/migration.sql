-- A topic is one living document: its scope, and who reviews what the sync
-- proposes for it. Health columns (last sync, pending suggestions) arrive with
-- the tickets that fill them.

-- CreateEnum
CREATE TYPE "knowledge_topic_language" AS ENUM ('en', 'de');

-- CreateTable
CREATE TABLE "knowledge_topic" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "repositories" JSONB NOT NULL,
    "language" "knowledge_topic_language" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_KnowledgeTopicMaintainers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_KnowledgeTopicMaintainers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_topic_organizationId_name_key" ON "knowledge_topic"("organizationId", "name");

-- CreateIndex
CREATE INDEX "_KnowledgeTopicMaintainers_B_index" ON "_KnowledgeTopicMaintainers"("B");

-- AddForeignKey
ALTER TABLE "knowledge_topic" ADD CONSTRAINT "knowledge_topic_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KnowledgeTopicMaintainers" ADD CONSTRAINT "_KnowledgeTopicMaintainers_A_fkey" FOREIGN KEY ("A") REFERENCES "knowledge_topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KnowledgeTopicMaintainers" ADD CONSTRAINT "_KnowledgeTopicMaintainers_B_fkey" FOREIGN KEY ("B") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

