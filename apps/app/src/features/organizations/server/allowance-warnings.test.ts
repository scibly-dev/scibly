import type * as DbModule from "@scibly/db";

import { getAllowanceWarningMailMessages } from "@scibly/email/i18n";
import { defaultLocale } from "@scibly/i18n/constants";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { transactionsRun } from "@/shared/testing/prisma-transaction";

// The plan catalogue is real so thresholds are tested against the actual grant — only the database, mail transport, membership policy, and `after` are doubled.
const db = vi.hoisted(() => ({
  organizationSubscription: { findUnique: vi.fn() },
  organizationCredit: { findUnique: vi.fn(), updateMany: vi.fn() },
  creditLedgerEntry: { create: vi.fn() },
  organization: { findUnique: vi.fn() },
  member: { findMany: vi.fn() },
  $transaction: vi.fn(),
}));

const mail = vi.hoisted(() => ({ sendEmail: vi.fn() }));
const organizations = vi.hoisted(() => ({
  requireOrganizationBySlug: vi.fn(),
  requireOrgMember: vi.fn(),
}));

const scheduled = vi.hoisted(() => [] as (() => unknown)[]);

vi.mock("@scibly/db", async (importOriginal) => ({
  ...(await importOriginal<typeof DbModule>()),
  db,
}));
vi.mock("@scibly/email/resend", () => ({ default: mail.sendEmail }));
vi.mock("@scibly/email/templates/allowance-warning-mail", () => ({
  default: vi.fn(() => null),
}));
vi.mock("next/server", () => ({
  after: (callback: () => unknown) => scheduled.push(callback),
}));
vi.mock("./policy", () => organizations);

const { notifyAllowanceThresholdCrossed } =
  await import("./allowance-warning-notice");
const { chargeGenerationAndWarn } = await import("./charge-generation");
const { readAllowanceWarningForOrg } =
  await import("../settings/api/allowance-warning.operations");

const ORG = "org-1";
const SLUG = "acme";
const OWNER = "user-owner";
const PERIOD_START = new Date("2026-08-01T00:00:00Z");

const ALLOWANCE = 1_000;

const copy = getAllowanceWarningMailMessages(defaultLocale);

const flushScheduled = async () => {
  const pending = scheduled.splice(0, scheduled.length);
  for (const callback of pending) await callback();
};

function havingUsed(
  used: number,
  overrides: { notified?: number; topupRemaining?: number } = {},
) {
  db.organizationSubscription.findUnique.mockResolvedValue({
    plan: "STARTER",
    status: "ACTIVE",
    purchasedLearnerSeats: 0,
    currentPeriodStart: PERIOD_START,
  });
  db.organizationCredit.findUnique.mockResolvedValue({
    allowanceRemaining: ALLOWANCE - used,
    topupRemaining: overrides.topupRemaining ?? 0,
    notifiedAllowanceThreshold: overrides.notified ?? 0,
    periodStart: PERIOD_START,
  });
}

const sentSubjects = () =>
  mail.sendEmail.mock.calls.map(([message]) => message.subject);

beforeEach(() => {
  vi.clearAllMocks();
  scheduled.length = 0;
  transactionsRun(db);
  db.organizationCredit.updateMany.mockResolvedValue({ count: 1 });
  db.organization.findUnique.mockResolvedValue({ name: "Acme", slug: SLUG });
  db.member.findMany.mockResolvedValue([
    { user: { email: "owner@acme.test" } },
  ]);
  organizations.requireOrganizationBySlug.mockResolvedValue({ id: ORG });
  organizations.requireOrgMember.mockResolvedValue({ role: "owner" });
});

describe("AW — how far into the allowance the organization is", () => {
  it("AW1: a fifth of the monthly grant left is a warning", async () => {
    havingUsed(800);

    await expect(readAllowanceWarningForOrg(SLUG, OWNER)).resolves.toEqual({
      threshold: 80,
      remaining: 200,
      allowance: ALLOWANCE,
      periodKey: PERIOD_START.toISOString(),
    });
  });

  it("AW3: past both lines, the organization is reported at the higher one", async () => {
    havingUsed(960);

    await expect(
      readAllowanceWarningForOrg(SLUG, OWNER),
    ).resolves.toMatchObject({ threshold: 95 });
  });

  it("AW4: one generation above the line there is no warning at all", async () => {
    havingUsed(799);

    await expect(readAllowanceWarningForOrg(SLUG, OWNER)).resolves.toBeNull();
  });

  it("AW2: a top-up that covers the rest of the month quiets the warning", async () => {
    havingUsed(800, { topupRemaining: 10_000 });

    await expect(readAllowanceWarningForOrg(SLUG, OWNER)).resolves.toBeNull();
  });

  it("AW2: the top-up counts towards the line rather than replacing it", async () => {
    havingUsed(960, { topupRemaining: 100 });

    await expect(
      readAllowanceWarningForOrg(SLUG, OWNER),
    ).resolves.toMatchObject({ threshold: 80, remaining: 140 });
  });

  it("AW2: a top-up spent back down warns again, at the line it now sits below", async () => {
    havingUsed(1000, { topupRemaining: 20 });

    await expect(
      readAllowanceWarningForOrg(SLUG, OWNER),
    ).resolves.toMatchObject({ threshold: 95, remaining: 20 });
  });

  it("AW6: an allowance credited past its own top warns about nothing", async () => {
    havingUsed(-200);

    await expect(readAllowanceWarningForOrg(SLUG, OWNER)).resolves.toBeNull();
  });

  it("AW7: an organization with no subscription is unknown, not exhausted", async () => {
    havingUsed(950);
    db.organizationSubscription.findUnique.mockResolvedValue(null);

    await expect(readAllowanceWarningForOrg(SLUG, OWNER)).resolves.toBeNull();
  });

  it("AW7: an organization with no credit row is unknown, not exhausted", async () => {
    havingUsed(950);
    db.organizationCredit.findUnique.mockResolvedValue(null);

    await expect(readAllowanceWarningForOrg(SLUG, OWNER)).resolves.toBeNull();
  });

  it("AB7: a member is refused the read, so nothing about the pool reaches them", async () => {
    havingUsed(950);
    organizations.requireOrgMember.mockRejectedValue(new Error("FORBIDDEN"));

    await expect(readAllowanceWarningForOrg(SLUG, OWNER)).rejects.toThrow();
    expect(db.organizationCredit.findUnique).not.toHaveBeenCalled();
  });
});

describe("AN/AM — notifying, once per threshold per period", () => {
  it("AN1: the crossing mails once and records the threshold it mailed", async () => {
    havingUsed(800);

    await notifyAllowanceThresholdCrossed(ORG);

    expect(db.organizationCredit.updateMany).toHaveBeenCalledWith({
      where: {
        organizationId: ORG,
        periodStart: PERIOD_START,
        notifiedAllowanceThreshold: { lt: 80 },
      },
      data: { notifiedAllowanceThreshold: 80 },
    });
    expect(sentSubjects()).toEqual([copy.byLevel[80].subject]);
  });

  it("AN1: a second generation past the same line mails nothing", async () => {
    havingUsed(830, { notified: 80 });

    await notifyAllowanceThresholdCrossed(ORG);

    expect(db.organizationCredit.updateMany).not.toHaveBeenCalled();
    expect(mail.sendEmail).not.toHaveBeenCalled();
  });

  it("AN2: crossing 95% after 80% mails again, more urgently", async () => {
    havingUsed(950, { notified: 80 });

    await notifyAllowanceThresholdCrossed(ORG);

    expect(sentSubjects()).toEqual([copy.byLevel[95].subject]);
    expect(copy.byLevel[95].subject).not.toEqual(copy.byLevel[80].subject);
  });

  it("AN3: one generation carrying the organization past both lines mails only the urgent one", async () => {
    havingUsed(960);

    await notifyAllowanceThresholdCrossed(ORG);

    expect(sentSubjects()).toEqual([copy.byLevel[95].subject]);
    expect(db.organizationCredit.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { notifiedAllowanceThreshold: 95 } }),
    );
  });

  it("AN4: the charge that loses the claim mails nothing", async () => {
    havingUsed(800);
    db.organizationCredit.updateMany.mockResolvedValue({ count: 0 });

    await notifyAllowanceThresholdCrossed(ORG);

    expect(mail.sendEmail).not.toHaveBeenCalled();
  });

  it("AN5: a refund back below 95% does not re-arm the line already crossed", async () => {
    havingUsed(820, { notified: 95 });

    await notifyAllowanceThresholdCrossed(ORG);

    expect(db.organizationCredit.updateMany).not.toHaveBeenCalled();
    expect(mail.sendEmail).not.toHaveBeenCalled();
  });

  it("AM1: only an owner who still wants email is written to", async () => {
    havingUsed(800);

    await notifyAllowanceThresholdCrossed(ORG);

    expect(db.member.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId: ORG,
          role: "owner",
          user: { emailNotifications: true },
        },
      }),
    );
  });

  it("AM3: an undeliverable warning is not an error the author sees", async () => {
    havingUsed(800);
    mail.sendEmail.mockRejectedValue(new Error("Resend is down"));

    await expect(notifyAllowanceThresholdCrossed(ORG)).resolves.toBeUndefined();
  });
});

describe("AM4 — where the warning hangs off the charge", () => {
  const charge = () =>
    chargeGenerationAndWarn(
      {
        db: db as never,
        organizationId: ORG,
        actorId: OWNER,
        action: "CHAT_MESSAGE",
      },
      () => Promise.resolve("generated"),
    );

  beforeEach(() => {
    havingUsed(800);
    db.creditLedgerEntry.create.mockResolvedValue({ id: "ledger-1" });
  });

  it("AM4: the generation returns before the warning is composed", async () => {
    await expect(charge()).resolves.toBe("generated");

    expect(mail.sendEmail).not.toHaveBeenCalled();
    expect(scheduled).toHaveLength(1);

    await flushScheduled();
    expect(sentSubjects()).toEqual([copy.byLevel[80].subject]);
  });

  it("AM4: an operation that fails is refunded, and a refunded generation is no crossing", async () => {
    await expect(
      chargeGenerationAndWarn(
        {
          db: db as never,
          organizationId: ORG,
          actorId: OWNER,
          action: "CHAT_MESSAGE",
        },
        () => Promise.reject(new Error("model unavailable")),
      ),
    ).rejects.toThrow("model unavailable");

    expect(scheduled).toHaveLength(0);
  });
});
