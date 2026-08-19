-- Tracks first-run onboarding; NULL means "has not acted yet".
CREATE TYPE "OnboardingStep" AS ENUM ('PLANS', 'COMPLETED');

ALTER TABLE "user"
ADD COLUMN "onboardingStep" "OnboardingStep";

-- Every account that predates onboarding is already past it.
UPDATE "user" SET "onboardingStep" = 'COMPLETED';
