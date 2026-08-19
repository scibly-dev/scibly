-- CreateEnum
CREATE TYPE "organization_ai_model_test_status" AS ENUM ('OK', 'FAILED');

-- AlterTable
ALTER TABLE "organization"
ADD COLUMN IF NOT EXISTS "defaultChatModelId" TEXT;

-- AlterTable
ALTER TABLE "organization_ai_model"
ADD COLUMN IF NOT EXISTS "lastTestStatus" "organization_ai_model_test_status",
ADD COLUMN IF NOT EXISTS "lastTestedAt" TIMESTAMP(3);

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'organization_defaultChatModelId_fkey'
  ) THEN
    ALTER TABLE "organization"
    ADD CONSTRAINT "organization_defaultChatModelId_fkey"
    FOREIGN KEY ("defaultChatModelId") REFERENCES "organization_ai_model"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
