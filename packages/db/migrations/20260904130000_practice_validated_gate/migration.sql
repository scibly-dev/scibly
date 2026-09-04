-- The publish gate practice scenes were always meant to have, now that
-- something computes the hash: a sha256 of the app fragment plus its answer
-- key, stamped by a self-test run that scored full marks in the editor's
-- preview frame. Publish re-derives it, so an edit to either column retires
-- the stamp on its own -- see docs/plans/practice-scenes.md.
ALTER TABLE "scene"
ADD COLUMN "practiceValidated" TEXT;
