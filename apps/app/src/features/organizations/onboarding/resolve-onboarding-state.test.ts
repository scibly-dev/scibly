import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  member: { findFirst: vi.fn() },
  invitation: { findFirst: vi.fn() },
}));

vi.mock("@scibly/db", () => ({ db }));

const { resolveOnboardingState } = await import("./resolve-onboarding-state");

beforeEach(() => {
  vi.clearAllMocks();
  db.member.findFirst.mockResolvedValue(null);
  db.invitation.findFirst.mockResolvedValue(null);
});

function user(onboardingStep: string | null) {
  db.user.findUnique.mockResolvedValue({
    email: "new@example.com",
    onboardingStep,
  });
}

describe("what onboarding shows a user", () => {
  it("OB1: offers organization creation to an untouched user with nothing waiting", async () => {
    user(null);

    await expect(resolveOnboardingState("user1")).resolves.toBe("create-org");
  });

  it("OB2: offers the invitation instead of creation when one is pending", async () => {
    user(null);
    db.invitation.findFirst.mockResolvedValue({ id: "inv1" });

    await expect(resolveOnboardingState("user1")).resolves.toBe(
      "accept-invite",
    );
  });

  it("OB3: shows the plans step to a user who just created their organization", async () => {
    user("PLANS");

    await expect(resolveOnboardingState("user1")).resolves.toBe("plans");
  });

  it("OB4: skips a user who finished onboarding", async () => {
    user("COMPLETED");

    await expect(resolveOnboardingState("user1")).resolves.toBe("skip");
  });

  it("OB5: skips a user who never onboarded but already belongs to an organization", async () => {
    user(null);
    db.member.findFirst.mockResolvedValue({ id: "m1" });
    db.invitation.findFirst.mockResolvedValue({ id: "inv1" });

    await expect(resolveOnboardingState("user1")).resolves.toBe("skip");
  });

  it("OB6: skips when the user row is gone rather than offering a screen", async () => {
    db.user.findUnique.mockResolvedValue(null);

    await expect(resolveOnboardingState("user1")).resolves.toBe("skip");
  });

  it("OB7: offers creation again to a finished user who asks for it from the sidebar", async () => {
    user("COMPLETED");

    await expect(resolveOnboardingState("user1", true)).resolves.toBe(
      "create-org",
    );
  });

  it("OB8: refuses even an explicit creation request once an organization exists", async () => {
    user("COMPLETED");
    db.member.findFirst.mockResolvedValue({ id: "m1" });

    await expect(resolveOnboardingState("user1", true)).resolves.toBe("skip");
  });
});
