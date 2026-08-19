-- AlterTable
ALTER TABLE "scene" ADD COLUMN "suggestedForDeletion" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "scene" ADD COLUMN "deletionReason" TEXT;
