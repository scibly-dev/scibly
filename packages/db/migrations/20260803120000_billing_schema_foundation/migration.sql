-- Billing schema foundation (#52): every organization gains a commercial
-- identity — a subscription, a credit balance, and an append-only credit
-- ledger. Plan limits are NOT stored per organization; they live as typed
-- constants in `src/plan-catalogue.ts`, keyed by the plan enum and read at
-- enforcement time, so a plan change takes effect immediately with no drift.

-- CreateEnum
CREATE TYPE "subscription_plan" AS ENUM ('TRIAL', 'STARTER', 'BUSINESS', 'PRO', 'INTERNAL');

-- CreateEnum
CREATE TYPE "subscription_status" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED');

-- CreateEnum
CREATE TYPE "credit_action" AS ENUM ('CHAT_MESSAGE', 'IMAGE_GENERATION', 'SOURCE_INGEST');

-- CreateEnum
CREATE TYPE "credit_bucket" AS ENUM ('ALLOWANCE', 'TOPUP');

-- CreateTable
CREATE TABLE "organization_subscription" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "plan" "subscription_plan" NOT NULL,
    "status" "subscription_status" NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3),
    "nextDue" TIMESTAMP(3),
    "purchasedLearnerSeats" INTEGER NOT NULL DEFAULT 0,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_credit" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "allowanceRemaining" INTEGER NOT NULL,
    "topupRemaining" INTEGER NOT NULL DEFAULT 0,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_credit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_ledger_entry" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "actorId" TEXT,
    "notebookId" TEXT,
    "action" "credit_action" NOT NULL,
    "creditsCharged" INTEGER NOT NULL,
    "bucket" "credit_bucket" NOT NULL,
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_ledger_entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_subscription_organizationId_key" ON "organization_subscription"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_subscription_stripeCustomerId_key" ON "organization_subscription"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_subscription_stripeSubscriptionId_key" ON "organization_subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_credit_organizationId_key" ON "organization_credit"("organizationId");

-- CreateIndex
CREATE INDEX "credit_ledger_entry_organizationId_createdAt_idx" ON "credit_ledger_entry"("organizationId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "credit_ledger_entry_organizationId_actorId_idx" ON "credit_ledger_entry"("organizationId", "actorId");

-- CreateIndex
CREATE INDEX "credit_ledger_entry_notebookId_idx" ON "credit_ledger_entry"("notebookId");

-- AddForeignKey
ALTER TABLE "organization_subscription" ADD CONSTRAINT "organization_subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_credit" ADD CONSTRAINT "organization_credit_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_ledger_entry" ADD CONSTRAINT "credit_ledger_entry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_ledger_entry" ADD CONSTRAINT "credit_ledger_entry_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_ledger_entry" ADD CONSTRAINT "credit_ledger_entry_notebookId_fkey" FOREIGN KEY ("notebookId") REFERENCES "notebook"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: every existing organization is Scibly-owned and moves onto the
-- INTERNAL plan — a plan with unreachable numbers, never a bypass flag, so
-- internal organizations traverse the same code paths customers will. INTERNAL
-- never bills, so `nextDue` and the period ends stay null; the usage window
-- falls back to the subscription's creation date.
INSERT INTO "organization_subscription"
    ("id", "organizationId", "plan", "status", "currentPeriodStart", "updatedAt")
SELECT gen_random_uuid()::text, o."id", 'INTERNAL', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "organization" o;

-- 1000000000 mirrors EFFECTIVELY_UNLIMITED in `src/plan-catalogue.ts` (the
-- INTERNAL plan's generation allowance).
INSERT INTO "organization_credit"
    ("id", "organizationId", "allowanceRemaining", "periodStart", "updatedAt")
SELECT gen_random_uuid()::text, o."id", 1000000000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "organization" o;
