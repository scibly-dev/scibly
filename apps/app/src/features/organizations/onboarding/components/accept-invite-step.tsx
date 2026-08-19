"use client";

import type { Locale } from "@scibly/i18n/constants";
import type { InvitationsPageTranslations } from "../../invitations/i18n/invitations.types";
import type { OnboardingPage } from "../i18n/onboarding.types";

import { routes } from "@scibly/routes";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { api } from "@/shared/api/trpc/client";

import { InvitationCardComponent } from "../../invitations/components/invitation-card";
import { SkipOnboardingButton } from "./skip-onboarding-button";

export function AcceptInviteStep({
  t,
  invitationsCopy,
  locale,
}: {
  t: OnboardingPage;
  invitationsCopy: InvitationsPageTranslations;
  locale: Locale;
}) {
  const router = useRouter();
  const { data: invitations = [], isLoading } =
    api.organization.listUserInvitations.useQuery();

  // Declining the last invitation leaves nothing to accept — re-resolve, which
  // offers organization creation instead of a dead end.
  useEffect(() => {
    if (!isLoading && invitations.length === 0) router.refresh();
  }, [isLoading, invitations.length, router]);

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-6">
      {isLoading ? (
        <Loader2 className="text-ink-faint h-6 w-6 animate-spin" />
      ) : (
        <div className="flex w-full flex-col gap-4">
          {invitations.map((invitation) => (
            <InvitationCardComponent
              key={invitation.id}
              invitation={invitation}
              t={invitationsCopy}
              locale={locale}
            />
          ))}
        </div>
      )}
      <SkipOnboardingButton
        label={t.invite.skip}
        destination={routes.app.profile.default}
      />
    </div>
  );
}
