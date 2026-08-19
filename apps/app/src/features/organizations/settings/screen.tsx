import { api, HydrateClient } from "@/shared/api/trpc/server";

import { resolveOrgScreen } from "../resolve-org-screen";
import { OrgSettingsForm } from "./components/org-settings-form";

export async function OrganizationSettingsScreen(props: {
  params: Promise<{ lang: string; orgSlug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const [{ lang, orgSlug }, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);
  const integrationConnected = searchParams.integration_connected;
  const integrationError = searchParams.integration_error;

  void api.orgAiConfig.listModels.prefetch({ orgSlug });

  const { dict, org } = await resolveOrgScreen(lang, orgSlug);
  const t = dict.orgSettings;

  return (
    <HydrateClient>
      <div className="flex w-full flex-col gap-8 pb-20">
        <div>
          <h1 className="text-foreground text-3xl font-semibold tracking-tight">
            {t.title}
          </h1>
          <p className="text-muted-foreground mt-2 text-[15px]">{t.subtitle}</p>
        </div>
        <OrgSettingsForm
          t={t}
          org={org}
          lang={lang}
          integrationConnected={integrationConnected}
          integrationError={integrationError}
        />
      </div>
    </HydrateClient>
  );
}
