-- The column was only ever written as NULL and read as a permanently-false
-- flag no caller consumed. Nothing computed the hash its doc comment promised,
-- and publish never checked it — see docs/plans/practice-scenes.md.
ALTER TABLE "scene"
DROP COLUMN "practiceValidated";
