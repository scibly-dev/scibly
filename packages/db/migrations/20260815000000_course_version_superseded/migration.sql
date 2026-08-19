-- "invalidated" meant two unrelated things in this codebase: a version a later
-- publish retired, and the cascade from a changed source to the draft scenes
-- grounded in it. The cascade keeps the word; the version side becomes
-- "superseded".
--
-- Written by hand as a RENAME. The generated diff for this is DROP + ADD, which
-- would forget which versions had been retired.
ALTER TABLE "course_version" RENAME COLUMN "invalidated" TO "superseded";
