"use client";

import type { OrgSettingsPage } from "@/features/organizations/contracts";

import { SettingsCard } from "@/shared/ui/settings-card";

import { DisconnectIntegrationDialog } from "./disconnect-integration-dialog";
import { OrgIntegrationsEmpty } from "./org-integrations-empty";
import { ProviderRow } from "./provider-row";
import { useOrgIntegrations } from "./use-org-integrations";

interface OrgIntegrationsCardProps {
  orgSlug: string;
  lang: string;
  t: OrgSettingsPage["integrations"];
}

export function OrgIntegrationsCard({
  orgSlug,
  lang,
  t,
}: OrgIntegrationsCardProps) {
  const {
    connections,
    allProviders,
    isConnectPending,
    isBusy,
    connect,
    pendingDisconnect,
    askToDisconnect,
    cancelDisconnect,
    confirmDisconnect,
    isConfirmingDisconnect,
  } = useOrgIntegrations({ orgSlug, lang, t });

  return (
    <SettingsCard title={t.title} description={t.description}>
      <div className="flex flex-col gap-3">
        {allProviders.map((p) => {
          const connection = connections.find(
            (c) => c.provider === p.providerId,
          );
          return (
            <ProviderRow
              key={p.providerId}
              provider={p}
              orgSlug={orgSlug}
              connection={connection}
              isBusy={isBusy(p.providerId)}
              isConnectPending={isConnectPending}
              t={t}
              onDisconnect={() => askToDisconnect(p.providerId)}
              onConnect={() => connect(p.providerId)}
            />
          );
        })}

        {allProviders.length === 0 && <OrgIntegrationsEmpty t={t} />}
      </div>
      <DisconnectIntegrationDialog
        provider={pendingDisconnect}
        isConfirming={isConfirmingDisconnect}
        onConfirm={confirmDisconnect}
        onClose={cancelDisconnect}
        t={t}
      />
    </SettingsCard>
  );
}
