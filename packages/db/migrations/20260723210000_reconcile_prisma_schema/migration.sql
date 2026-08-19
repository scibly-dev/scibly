-- Reconcile historical objects that were created outside the checked-in
-- migration sequence. This remains replay-safe for databases already matching
-- the current Prisma schema.

-- Remove enums no longer represented by the Prisma schema.
DROP TYPE IF EXISTS "Difficulty";

-- Move the model type enum to its mapped database name.
DO $$ BEGIN
    CREATE TYPE "organization_ai_model_type" AS ENUM ('CHAT', 'EMBEDDING', 'IMAGE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'organization_ai_model'
          AND column_name = 'type'
          AND udt_name = 'OrganizationAIModelType'
    ) THEN
        ALTER TABLE "organization_ai_model"
            ALTER COLUMN "type" DROP DEFAULT,
            ALTER COLUMN "type" TYPE "organization_ai_model_type"
                USING ("type"::text::"organization_ai_model_type"),
            ALTER COLUMN "type" SET DEFAULT 'CHAT';
    END IF;
END $$;

DROP TYPE IF EXISTS "OrganizationAIModelType";

DROP INDEX IF EXISTS "organization_ai_model_organizationId_type_idx";
CREATE INDEX IF NOT EXISTS "organization_ai_model_organizationId_idx"
    ON "organization_ai_model"("organizationId");

-- Preserve existing chat text as AI SDK message parts.
ALTER TABLE "notebook_chat"
    ADD COLUMN IF NOT EXISTS "parts" JSONB;

DO $$ BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'notebook_chat'
          AND column_name = 'content'
    ) THEN
        UPDATE "notebook_chat"
        SET "parts" = jsonb_build_array(
            jsonb_build_object('type', 'text', 'text', "content")
        )
        WHERE "parts" IS NULL;
    END IF;
END $$;

ALTER TABLE "notebook_chat"
    ALTER COLUMN "parts" SET NOT NULL,
    DROP COLUMN IF EXISTS "content";

-- Remove legacy publication fields superseded by CourseVersion.
ALTER TABLE "lesson"
    DROP COLUMN IF EXISTS "publishedAt";

ALTER TABLE "scene"
    DROP COLUMN IF EXISTS "draftId",
    DROP COLUMN IF EXISTS "isPublished",
    DROP COLUMN IF EXISTS "publishedAt";
