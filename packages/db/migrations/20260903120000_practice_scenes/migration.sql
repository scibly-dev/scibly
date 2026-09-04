-- PRACTICE is a second scene kind: an agent-generated interactive mini-app,
-- graded server-side against a solution instead of question blocks — see
-- docs/plans/practice-scenes.md. Every existing scene is a DOCUMENT, which is
-- what the default says.
CREATE TYPE "SceneKind" AS ENUM ('DOCUMENT', 'PRACTICE');

ALTER TABLE "scene"
ADD COLUMN "kind" "SceneKind" NOT NULL DEFAULT 'DOCUMENT',
ADD COLUMN "practiceHtml" TEXT,
ADD COLUMN "practiceSolution" JSONB,
ADD COLUMN "practiceExplain" TEXT,
ADD COLUMN "practiceValidated" TEXT;
