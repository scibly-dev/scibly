-- The collection stage: merged pull requests worth learning from become
-- bundles, held for the organization against the repository they came from.
-- A run is both the record of one repository's turn and the watermark — only a
-- run that succeeded says how far collection has got.

-- CreateEnum
CREATE TYPE "knowledge_discard_reason" AS ENUM ('BOT_AUTHOR', 'CHORE_TITLE', 'NO_DISCUSSION', 'LOW_DENSITY');

-- CreateEnum
CREATE TYPE "knowledge_collection_run_status" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "knowledge_collection_run" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "status" "knowledge_collection_run_status" NOT NULL DEFAULT 'QUEUED',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "collected" INTEGER NOT NULL DEFAULT 0,
    "discarded" INTEGER NOT NULL DEFAULT 0,
    "collectedThrough" TIMESTAMP(3),
    "capped" BOOLEAN NOT NULL DEFAULT false,
    "failureReason" TEXT,

    CONSTRAINT "knowledge_collection_run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_bundle" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "githubUpdatedAt" TIMESTAMP(3) NOT NULL,
    "mergedAt" TIMESTAMP(3),
    "score" INTEGER,
    "discardReason" "knowledge_discard_reason",
    "content" JSONB,
    "title" TEXT,
    "url" TEXT,
    "filePaths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "truncated" BOOLEAN NOT NULL DEFAULT false,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_bundle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "knowledge_collection_run_org_repo_status_idx" ON "knowledge_collection_run"("organizationId", "repositoryId", "status", "startedAt");

-- One waiting turn per repository. Partial, so history keeps as many finished
-- runs as it likes — Prisma cannot express this index, so it lives here and as
-- a comment on the model; keep the two in step by hand.
CREATE UNIQUE INDEX "knowledge_collection_run_one_queued_key" ON "knowledge_collection_run"("organizationId", "repositoryId") WHERE "status" = 'QUEUED';

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_bundle_org_repo_external_key" ON "knowledge_bundle"("organizationId", "repositoryId", "externalId");

-- CreateIndex
CREATE INDEX "knowledge_bundle_org_repo_collected_idx" ON "knowledge_bundle"("organizationId", "repositoryId", "collectedAt");

-- AddForeignKey
ALTER TABLE "knowledge_collection_run" ADD CONSTRAINT "knowledge_collection_run_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_bundle" ADD CONSTRAINT "knowledge_bundle_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
