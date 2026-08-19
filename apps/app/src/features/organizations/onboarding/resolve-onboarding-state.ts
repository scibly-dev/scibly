import { db } from "@scibly/db";

/** Which first-run screen a user should see, or `skip` to send them onward. */
export type OnboardingState = "skip" | "plans" | "accept-invite" | "create-org";

// `forceCreate` is the sidebar's "+" arriving: someone who already skipped onboarding asking for the creation screen on purpose, not a fresh login routing them here.
export async function resolveOnboardingState(
  userId: string,
  forceCreate = false,
): Promise<OnboardingState> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, onboardingStep: true },
  });

  if (!user) return "skip";
  if (user.onboardingStep === "PLANS") return "plans";

  const isDone = user.onboardingStep === "COMPLETED";
  if (isDone && !forceCreate) return "skip";

  // An organization already exists — whether onboarding created it or an admin
  // added the user outside the signup flow, there is nothing left to offer.
  const membership = await db.member.findFirst({
    where: { userId },
    select: { id: true },
  });
  if (membership) return "skip";
  if (isDone) return "create-org";

  // `organizationLimit: 1` counts owned and joined alike, so someone with an
  // invitation waiting cannot also keep an organization of their own.
  const invitation = await db.invitation.findFirst({
    where: { email: user.email, status: "pending" },
    select: { id: true },
  });
  return invitation ? "accept-invite" : "create-org";
}
