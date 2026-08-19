import { getSession } from "@scibly/auth/session";
import { getLocale } from "@scibly/i18n";
import {
  ONBOARDING_CREATE_ORG_INTENT,
  ONBOARDING_INTENT_QUERY_PARAM,
  routes,
} from "@scibly/routes";
import { redirect } from "next/navigation";

import { getFullDictionary } from "@/i18n/dictionaries";
import { api } from "@/shared/api/trpc/server";

import { AcceptInviteStep } from "./components/accept-invite-step";
import { CreateOrgStep } from "./components/create-org-step";
import { OnboardingShell } from "./components/onboarding-shell";
import { PlansStep } from "./components/plans-step";
import { resolveOnboardingState } from "./resolve-onboarding-state";

export async function OnboardingScreen(props: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ intent?: string }>;
}) {
  const [{ lang }, searchParams, session] = await Promise.all([
    props.params,
    props.searchParams,
    getSession(),
  ]);

  if (!session?.user) redirect(routes.app.auth.default);

  const state = await resolveOnboardingState(
    session.user.id,
    searchParams[ONBOARDING_INTENT_QUERY_PARAM] ===
      ONBOARDING_CREATE_ORG_INTENT,
  );

  if (state === "skip") redirect(routes.app.profile.default);

  const dict = await getFullDictionary(lang);
  const t = dict.onboarding;

  if (state === "create-org") {
    return (
      <OnboardingShell {...t.createOrg}>
        <CreateOrgStep t={t} />
      </OnboardingShell>
    );
  }

  if (state === "accept-invite") {
    return (
      <OnboardingShell {...t.invite}>
        <AcceptInviteStep
          t={t}
          invitationsCopy={dict.invitations}
          locale={getLocale(lang, true)}
        />
      </OnboardingShell>
    );
  }

  const org = await api.organization.getMine();
  if (!org) redirect(routes.app.profile.default);

  // The balance is what the trial granted; a failure to read it costs a
  // sentence of copy, not the step.
  const balance = await api.billing
    .getGenerationBalance({ orgSlug: org.slug })
    .catch(() => ({ remaining: null }));

  return (
    <OnboardingShell {...t.plans}>
      <PlansStep
        orgId={org.id}
        orgSlug={org.slug}
        lang={lang}
        credits={balance.remaining}
        t={t}
        planCopy={dict.orgBilling.plan}
      />
    </OnboardingShell>
  );
}
