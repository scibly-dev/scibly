import { routes } from "@scibly/routes";
import { redirect } from "next/navigation";

import { resolveOrgScreen } from "@/features/organizations/resolve-org-screen";
import { api, HydrateClient } from "@/shared/api/trpc/server";

import { BillingOverview } from "./components/billing-overview";

export async function OrganizationBillingScreen(props: {
  params: Promise<{ lang: string; orgSlug: string }>;
}) {
  const { lang, orgSlug } = await props.params;

  const statusPromise = api.billing.getStatus({ orgSlug });

  void api.billing.getUsageOverview.prefetch({ orgSlug });
  void api.billing.getStatus.prefetch({ orgSlug });

  const [{ dict, org }, status] = await Promise.all([
    resolveOrgScreen(lang, orgSlug),
    statusPromise,
  ]);
  const t = dict.orgBilling;

  if (!status.canManageBilling) {
    return redirect(routes.app.profile.org(orgSlug).default());
  }

  return (
    <HydrateClient>
      <div className="flex w-full flex-col gap-8 pb-20">
        <div>
          <h1 className="text-foreground text-3xl font-semibold tracking-tight">
            {t.title}
          </h1>
          <p className="text-muted-foreground mt-2 text-[15px]">{t.subtitle}</p>
        </div>
        <BillingOverview orgId={org.id} orgSlug={orgSlug} lang={lang} t={t} />
      </div>
    </HydrateClient>
  );
}
