-- The publish gate no longer needs a stamp. `checkPracticeScene` reads
-- practiceHtml against practiceSolution on every publish, which is the same
-- check the editor's Validate button reports, so there is nothing to remember
-- between the two -- see docs/plans/practice-scenes.md.
ALTER TABLE "scene"
DROP COLUMN "practiceValidated";
