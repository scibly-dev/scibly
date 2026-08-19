-- Repair prerequisites that were present in development when the following
-- migration was created, but were missing from the checked-in migration
-- history. Every operation is safe to replay against a database that already
-- has the publishing/session schema.

-- Course publishing settings
ALTER TABLE "course"
    ADD COLUMN IF NOT EXISTS "passingScorePct" INTEGER,
    ADD COLUMN IF NOT EXISTS "maxTries" INTEGER,
    ADD COLUMN IF NOT EXISTS "allowAnonymous" BOOLEAN NOT NULL DEFAULT false;

-- Published course versions
CREATE TABLE IF NOT EXISTS "course_version" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedById" TEXT,
    "invalidated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "course_version_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "course_version_courseId_idx"
    ON "course_version"("courseId");
CREATE INDEX IF NOT EXISTS "course_version_publishedById_idx"
    ON "course_version"("publishedById");
CREATE UNIQUE INDEX IF NOT EXISTS "course_version_courseId_version_key"
    ON "course_version"("courseId", "version");

DO $$ BEGIN
    ALTER TABLE "course_version"
        ADD CONSTRAINT "course_version_courseId_fkey"
        FOREIGN KEY ("courseId") REFERENCES "course"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "course_version"
        ADD CONSTRAINT "course_version_publishedById_fkey"
        FOREIGN KEY ("publishedById") REFERENCES "user"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Enrollment publishing fields
ALTER TABLE "course_enrollment"
    ADD COLUMN IF NOT EXISTS "courseVersionId" TEXT,
    ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "triesUsed" INTEGER NOT NULL DEFAULT 0;

-- Existing pre-version enrollments need a deterministic legacy version before
-- courseVersionId can become required.
INSERT INTO "course_version" (
    "id",
    "courseId",
    "version",
    "publishedAt",
    "publishedById",
    "invalidated"
)
SELECT
    'migration-' || md5("course"."id"),
    "course"."id",
    1,
    CURRENT_TIMESTAMP,
    NULL,
    false
FROM "course"
WHERE EXISTS (
    SELECT 1
    FROM "course_enrollment"
    WHERE "course_enrollment"."courseId" = "course"."id"
      AND "course_enrollment"."courseVersionId" IS NULL
)
AND NOT EXISTS (
    SELECT 1
    FROM "course_version"
    WHERE "course_version"."courseId" = "course"."id"
)
ON CONFLICT DO NOTHING;

UPDATE "course_enrollment"
SET "courseVersionId" = (
    SELECT "course_version"."id"
    FROM "course_version"
    WHERE "course_version"."courseId" = "course_enrollment"."courseId"
    ORDER BY "course_version"."version" DESC
    LIMIT 1
)
WHERE "courseVersionId" IS NULL;

ALTER TABLE "course_enrollment"
    ALTER COLUMN "courseVersionId" SET NOT NULL,
    ALTER COLUMN "userId" DROP NOT NULL;

DROP INDEX IF EXISTS "course_enrollment_userId_courseId_key";

CREATE INDEX IF NOT EXISTS "course_enrollment_courseVersionId_idx"
    ON "course_enrollment"("courseVersionId");
CREATE UNIQUE INDEX IF NOT EXISTS "course_enrollment_userId_courseVersionId_key"
    ON "course_enrollment"("userId", "courseVersionId");

ALTER TABLE "course_enrollment"
    DROP CONSTRAINT IF EXISTS "course_enrollment_userId_fkey";

DO $$ BEGIN
    ALTER TABLE "course_enrollment"
        ADD CONSTRAINT "course_enrollment_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "user"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "course_enrollment"
        ADD CONSTRAINT "course_enrollment_courseVersionId_fkey"
        FOREIGN KEY ("courseVersionId") REFERENCES "course_version"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Published lesson/scene copies
ALTER TABLE "lesson"
    ADD COLUMN IF NOT EXISTS "courseVersionId" TEXT,
    ADD COLUMN IF NOT EXISTS "sourceLessonId" TEXT;

CREATE INDEX IF NOT EXISTS "lesson_courseVersionId_idx"
    ON "lesson"("courseVersionId");
CREATE INDEX IF NOT EXISTS "lesson_sourceLessonId_idx"
    ON "lesson"("sourceLessonId");

DO $$ BEGIN
    ALTER TABLE "lesson"
        ADD CONSTRAINT "lesson_courseVersionId_fkey"
        FOREIGN KEY ("courseVersionId") REFERENCES "course_version"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "lesson"
        ADD CONSTRAINT "lesson_sourceLessonId_fkey"
        FOREIGN KEY ("sourceLessonId") REFERENCES "lesson"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'scene'
          AND column_name = 'xp'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'scene'
          AND column_name = 'sp'
    ) THEN
        ALTER TABLE "scene" RENAME COLUMN "xp" TO "sp";
    END IF;
END $$;

ALTER TABLE "scene"
    ADD COLUMN IF NOT EXISTS "courseVersionId" TEXT,
    ADD COLUMN IF NOT EXISTS "sourceSceneId" TEXT;

CREATE INDEX IF NOT EXISTS "scene_courseVersionId_idx"
    ON "scene"("courseVersionId");
CREATE INDEX IF NOT EXISTS "scene_sourceSceneId_idx"
    ON "scene"("sourceSceneId");

DO $$ BEGIN
    ALTER TABLE "scene"
        ADD CONSTRAINT "scene_courseVersionId_fkey"
        FOREIGN KEY ("courseVersionId") REFERENCES "course_version"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "scene"
        ADD CONSTRAINT "scene_sourceSceneId_fkey"
        FOREIGN KEY ("sourceSceneId") REFERENCES "scene"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Lesson-scoped learner progress
ALTER TABLE "scene_progress"
    ADD COLUMN IF NOT EXISTS "lessonId" TEXT,
    ADD COLUMN IF NOT EXISTS "spEarned" INTEGER NOT NULL DEFAULT 0;

UPDATE "scene_progress"
SET "lessonId" = "scene"."lessonId"
FROM "scene"
WHERE "scene_progress"."sceneId" = "scene"."id"
  AND "scene_progress"."lessonId" IS NULL;

ALTER TABLE "scene_progress"
    ALTER COLUMN "lessonId" SET NOT NULL;

DROP INDEX IF EXISTS "scene_progress_enrollmentId_sceneId_key";

CREATE INDEX IF NOT EXISTS "scene_progress_lessonId_idx"
    ON "scene_progress"("lessonId");
CREATE UNIQUE INDEX IF NOT EXISTS "scene_progress_enrollmentId_lessonId_sceneId_key"
    ON "scene_progress"("enrollmentId", "lessonId", "sceneId");

DO $$ BEGIN
    ALTER TABLE "scene_progress"
        ADD CONSTRAINT "scene_progress_lessonId_fkey"
        FOREIGN KEY ("lessonId") REFERENCES "lesson"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Anonymous course sessions (matches the current Prisma model)
CREATE TABLE IF NOT EXISTS "anonymous_course_session" (
    "id" TEXT NOT NULL,
    "anonymousId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "courseVersionId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "totalSpEarned" INTEGER NOT NULL DEFAULT 0,
    "scorePct" INTEGER,
    "triesUsed" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anonymous_course_session_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "anonymous_course_session_courseId_idx"
    ON "anonymous_course_session"("courseId");
CREATE INDEX IF NOT EXISTS "anonymous_course_session_courseVersionId_idx"
    ON "anonymous_course_session"("courseVersionId");
CREATE UNIQUE INDEX IF NOT EXISTS "anonymous_course_session_anonymousId_courseVersionId_key"
    ON "anonymous_course_session"("anonymousId", "courseVersionId");

DO $$ BEGIN
    ALTER TABLE "anonymous_course_session"
        ADD CONSTRAINT "anonymous_course_session_courseId_fkey"
        FOREIGN KEY ("courseId") REFERENCES "course"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "anonymous_course_session"
        ADD CONSTRAINT "anonymous_course_session_courseVersionId_fkey"
        FOREIGN KEY ("courseVersionId") REFERENCES "course_version"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Certificates are referenced by the following migration as well.
CREATE TABLE IF NOT EXISTS "certificate" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT,
    "courseVersionId" TEXT,
    "userId" TEXT,
    "organizationId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "courseName" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "totalSpEarned" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certificate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "certificate_enrollmentId_key"
    ON "certificate"("enrollmentId");
CREATE INDEX IF NOT EXISTS "certificate_enrollmentId_idx"
    ON "certificate"("enrollmentId");
CREATE INDEX IF NOT EXISTS "certificate_userId_organizationId_idx"
    ON "certificate"("userId", "organizationId");
CREATE UNIQUE INDEX IF NOT EXISTS "certificate_userId_courseVersionId_key"
    ON "certificate"("userId", "courseVersionId");

DO $$ BEGIN
    ALTER TABLE "certificate"
        ADD CONSTRAINT "certificate_enrollmentId_fkey"
        FOREIGN KEY ("enrollmentId") REFERENCES "course_enrollment"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "certificate"
        ADD CONSTRAINT "certificate_courseVersionId_fkey"
        FOREIGN KEY ("courseVersionId") REFERENCES "course_version"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "certificate"
        ADD CONSTRAINT "certificate_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "user"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "certificate"
        ADD CONSTRAINT "certificate_organizationId_fkey"
        FOREIGN KEY ("organizationId") REFERENCES "organization"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
