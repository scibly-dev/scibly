-- A BYOAI endpoint cannot be introspected the way gateway models can, so the
-- tier decision has to be told how much context it accepts. NULL means "unknown,
-- assume the conservative default".
-- AlterTable
ALTER TABLE "organization_ai_model" ADD COLUMN "contextWindow" INTEGER;
