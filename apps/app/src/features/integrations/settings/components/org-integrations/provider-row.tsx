import type { IntegrationProviderId } from "@/features/integrations/contracts";
import type { OrgSettingsPage } from "@/features/organizations/contracts";

import { ProviderAction } from "./provider-action";
import { ProviderGrants } from "./provider-grants";
import { ProviderIcon } from "./provider-icon";
import { ProviderStatus } from "./provider-status";

export type ProviderRowProps = {
  provider: {
    providerId: IntegrationProviderId;
    displayName: string;
    listsGrants?: boolean;
  };
  connection?: { workspaceName: string | null };
  /** Whether this row's disconnect is out of reach for the moment. */
  isBusy: boolean;
  isConnectPending: boolean;
  t: OrgSettingsPage["integrations"];
  orgSlug: string;
  onConnect: () => void;
  onDisconnect: () => void;
};

export const ProviderRow = (props: ProviderRowProps) => {
  const { provider, connection, orgSlug, t } = props;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 px-4 py-3 dark:border-neutral-800">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
            <ProviderIcon providerId={provider.providerId} />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
              {t.providers[provider.providerId]}
            </p>
            <ProviderStatus connection={connection} t={t} />
          </div>
        </div>
        <div className="shrink-0">
          <ProviderAction {...props} />
        </div>
      </div>
      {connection && provider.listsGrants ? (
        <ProviderGrants
          orgSlug={orgSlug}
          provider={provider.providerId}
          t={t}
        />
      ) : null}
    </div>
  );
};
