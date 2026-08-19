import { createCallerFactory } from "@scibly/api/trpc";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The organization router runs for real; better-auth and the db are stubbed since what's under test is the onboarding step each procedure leaves behind.

const db = vi.hoisted(() => ({
  user: { update: vi.fn() },
  organization: { findUnique: vi.fn() },
}));

const authApi = vi.hoisted(() => ({
  createOrganization: vi.fn(),
  acceptInvitation: vi.fn(),
}));

vi.mock("@scibly/db", () => ({ db, toMemberRole: (role: string) => role }));
vi.mock("@scibly/auth/config", () => ({ auth: { api: authApi } }));

const { organizationRouter } = await import("../../api/organization.router");

const createCaller = createCallerFactory(organizationRouter);

function caller() {
  const now = new Date("2026-01-01T00:00:00Z");
  return createCaller({
    db: db as never,
    headers: new Headers(),
    locale: "en",
    correlationId: "corr-1",
    session: {
      session: {
        id: "sess-1",
        createdAt: now,
        updatedAt: now,
        userId: "user-1",
        expiresAt: new Date("2026-12-31T00:00:00Z"),
        token: "token",
      },
      user: {
        id: "user-1",
        name: "Ada",
        email: "ada@example.com",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
    },
    actor: { userId: "user-1" },
  } as never);
}

function stepWrittenFor(userId: string) {
  const call = db.user.update.mock.calls.find(
    ([args]) => (args as { where: { id: string } }).where.id === userId,
  );
  return (call?.[0] as { data: { onboardingStep: string } } | undefined)?.data
    .onboardingStep;
}

beforeEach(() => {
  vi.clearAllMocks();
  db.organization.findUnique.mockResolvedValue(null);
  db.user.update.mockResolvedValue({});
});

describe("what each onboarding action persists", () => {
  it("OT1: creating an organization moves the user on to the plans step", async () => {
    authApi.createOrganization.mockResolvedValue({ id: "org-1", slug: "acme" });

    await caller().create({ name: "Acme", slug: "acme" });

    expect(stepWrittenFor("user-1")).toBe("PLANS");
  });

  it("OT2: a failed creation leaves the onboarding step untouched", async () => {
    db.organization.findUnique.mockResolvedValue({ id: "org-1" });

    await expect(
      caller().create({ name: "Acme", slug: "acme" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("OT3: accepting an invitation finishes onboarding, skipping the plans step", async () => {
    authApi.acceptInvitation.mockResolvedValue({ member: { role: "member" } });

    await caller().acceptInvitation({ invitationId: "inv-1" });

    expect(stepWrittenFor("user-1")).toBe("COMPLETED");
  });

  it("OT4: completeOnboarding only marks onboarding done", async () => {
    await caller().completeOnboarding();

    expect(db.user.update).toHaveBeenCalledTimes(1);
    expect(stepWrittenFor("user-1")).toBe("COMPLETED");
  });
});
