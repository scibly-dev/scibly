-- New scenes now start at 0 SP so authors opt into awarding points instead of
-- opting out. Existing rows keep whatever SP they were created with — this
-- only changes the default applied to future inserts.
-- AlterTable
ALTER TABLE "scene" ALTER COLUMN "sp" SET DEFAULT 0;
