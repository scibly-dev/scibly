-- Billable learner seats (#55): `organizationId` denormalised from the course
-- onto each enrollment, so the billable learner count is one indexed
-- distinct-count over [organizationId, userId] instead of a join through
-- courses on every enrollment attempt. Backfilled from the course join before
-- tightening to NOT NULL; the enrollment write path stamps it from here on.

-- AlterTable (nullable first so existing rows survive the ADD)
ALTER TABLE "course_enrollment" ADD COLUMN "organizationId" TEXT;

-- Backfill from the owning course
UPDATE "course_enrollment" ce
SET "organizationId" = c."organizationId"
FROM "course" c
WHERE ce."courseId" = c."id";

-- Every enrollment has a course (FK, Cascade), so no row is left null
ALTER TABLE "course_enrollment" ALTER COLUMN "organizationId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "course_enrollment_organizationId_userId_idx" ON "course_enrollment"("organizationId", "userId");

-- AddForeignKey
ALTER TABLE "course_enrollment" ADD CONSTRAINT "course_enrollment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
