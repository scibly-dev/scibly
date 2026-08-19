-- Issue #64: allowance warnings at 80% and 95%.
--
-- Records the highest threshold already mailed in the current billing period so
-- each fires once (AN1) rather than on every action past the line. A default of
-- 0 arms both thresholds for every existing organization, which is the right
-- starting point: nobody has been warned yet this period.
ALTER TABLE "organization_credit"
  ADD COLUMN "notifiedAllowanceThreshold" INTEGER NOT NULL DEFAULT 0;
