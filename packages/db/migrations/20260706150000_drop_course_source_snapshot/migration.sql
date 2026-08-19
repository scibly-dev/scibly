-- SIMPLIFY-2: drop CourseSourceSnapshot. Lineage + the per-scene `isOutdated`
-- flag already carry the "did this source change" signal; the snapshot
-- table was a second, half-broken (INV-7) copy of the same information.
DROP TABLE IF EXISTS "course_source_snapshot";
