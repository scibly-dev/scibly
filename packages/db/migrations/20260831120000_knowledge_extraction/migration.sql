-- The model stages: triage routes a bundle to the topics it belongs to, and
-- extraction re-authors the argument in it into claims that cite where they
-- came from. A bundle's content is pruned once the funnel is done with it, so
-- only the outcome survives.

-- AlterEnum
ALTER TYPE "credit_action" ADD VALUE 'KNOWLEDGE_EXTRACT';

-- CreateEnum
CREATE TYPE "knowledge_bundle_outcome" AS ENUM ('OFF_TOPIC', 'LOW_VALUE', 'EXTRACTED', 'NO_INSIGHTS', 'UNFUNDED');

-- CreateEnum
CREATE TYPE "knowledge_insight_status" AS ENUM ('PROPOSED', 'ACCEPTED', 'REJECTED', 'SUPERSEDED');

-- AlterTable
ALTER TABLE "knowledge_bundle" ADD COLUMN     "outcome" "knowledge_bundle_outcome",
ADD COLUMN     "processedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "knowledge_insight" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "bundleId" TEXT,
    "claim" TEXT NOT NULL,
    "citations" JSONB NOT NULL,
    "confidence" INTEGER NOT NULL,
    "status" "knowledge_insight_status" NOT NULL DEFAULT 'PROPOSED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_insight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "knowledge_bundle_org_unprocessed_idx" ON "knowledge_bundle"("organizationId", "processedAt", "collectedAt");

-- CreateIndex
CREATE INDEX "knowledge_insight_topic_status_idx" ON "knowledge_insight"("topicId", "status", "createdAt" DESC);

-- CreateIndex
-- Every extraction clears the bundle's previous claims before writing new ones,
-- and Postgres does not index a foreign key on its own.
CREATE INDEX "knowledge_insight_bundle_idx" ON "knowledge_insight"("bundleId");

-- AddForeignKey
ALTER TABLE "knowledge_insight" ADD CONSTRAINT "knowledge_insight_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_insight" ADD CONSTRAINT "knowledge_insight_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "knowledge_topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_insight" ADD CONSTRAINT "knowledge_insight_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "knowledge_bundle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
