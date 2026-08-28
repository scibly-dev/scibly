"use client";

import type { IntegrationProviderId } from "@/features/integrations/contracts";
import type { OrgSettingsPage } from "@/features/organizations/contracts";

import { Button } from "@scibly/ui/components/button";
import { CheckCircle2, ExternalLink, Unplug, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { api } from "@/shared/api/trpc/client";
import { SettingsCard } from "@/shared/ui/settings-card";

export const NotionIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z" />
    </svg>
  );
};

export const GitHubIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58l-.01-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.96 0-1.31.47-2.39 1.24-3.23-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.92 1.24 3.23 0 4.63-2.81 5.65-5.49 5.95.43.37.82 1.1.82 2.22l-.01 3.29c0 .32.21.7.82.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z" />
    </svg>
  );
};

const PROVIDER_ICONS = {
  NOTION: NotionIcon,
  GITHUB: GitHubIcon,
} satisfies Record<
  IntegrationProviderId,
  React.ComponentType<{ className?: string }>
>;

function renderProviderIcon(providerId: IntegrationProviderId) {
  const IconComponent = PROVIDER_ICONS[providerId];
  return (
    <IconComponent className="h-4 w-4 text-neutral-800 dark:text-neutral-200" />
  );
}

interface OrgIntegrationsCardProps {
  orgSlug: string;
  lang: string;
  t: OrgSettingsPage["integrations"];
}

type ProviderRowProps = {
  provider: {
    providerId: IntegrationProviderId;
    displayName: string;
    listsGrants?: boolean;
  };
  connection?: { workspaceName: string | null };
  isDisconnecting: boolean;
  isConnectPending: boolean;
  isDisconnectPending: boolean;
  t: OrgSettingsPage["integrations"];
  orgSlug: string;
  onConnect: () => void;
  onDisconnect: () => void;
};

export const ProviderStatus = ({
  connection,
  t,
}: Pick<ProviderRowProps, "connection" | "t">) => {
  if (!connection) {
    return (
      <p className="flex items-center gap-1 text-[11px] text-neutral-400">
        <XCircle className="h-3 w-3" />
        {t.notConnectedStatus}
      </p>
    );
  }
  return (
    <p className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
      <CheckCircle2 className="h-3 w-3" />
      {connection.workspaceName
        ? `${t.connectedStatus} · ${connection.workspaceName}`
        : t.connectedStatus}
    </p>
  );
};

export const ProviderAction = ({
  provider,
  connection,
  isDisconnecting,
  isConnectPending,
  isDisconnectPending,
  t,
  onConnect,
  onDisconnect,
}: ProviderRowProps) => {
  if (connection) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onDisconnect}
        disabled={isDisconnecting || isDisconnectPending}
        className="gap-1.5 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
        aria-label={`${t.disconnectButton} ${provider.displayName}`}
      >
        <Unplug className="h-3.5 w-3.5" />
        {t.disconnectButton}
      </Button>
    );
  }
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onConnect}
      disabled={isConnectPending}
      className="gap-1.5"
      aria-label={`${t.connectButton} ${provider.displayName}`}
    >
      <ExternalLink className="h-3.5 w-3.5" />
      {t.connectButton}
    </Button>
  );
};

// Its own query, so the card renders at once and only this strip waits on the
// provider.
export const ProviderGrants = ({
  orgSlug,
  provider,
  t,
}: {
  orgSlug: string;
  provider: IntegrationProviderId;
  t: OrgSettingsPage["integrations"];
}) => {
  const utils = api.useUtils();
  const { data, isPending, isError, error } =
    api.integration.listGrants.useQuery({
      orgSlug,
      provider,
    });

  // The token this query needs is minted per call, so this strip is where an
  // uninstall on the provider's side first shows up. The server has already
  // dropped the connection by the time the error arrives; refetching the list
  // is what takes the row off the page.
  const wasRevoked = error?.data?.applicationCode === "integration.revoked";
  useEffect(() => {
    if (!wasRevoked) return;
    toast.error(t.revokedNotice, { id: `integration-revoked-${provider}` });
    void utils.integration.list.invalidate({ orgSlug });
  }, [wasRevoked, provider, orgSlug, t.revokedNotice, utils]);

  if (isPending) {
    return <p className="text-[11px] text-neutral-400">{t.grantsLoading}</p>;
  }
  if (isError) {
    return <p className="text-[11px] text-neutral-400">{t.grantsError}</p>;
  }
  if (data.grants.length === 0) {
    return <p className="text-[11px] text-neutral-400">{t.grantsEmpty}</p>;
  }
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
        {t.grantsTitle}
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {data.grants.map((grant) => (
          <li key={grant.id}>
            <a
              href={grant.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-0.5 text-[11px] text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              {grant.name}
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const ProviderRow = (props: ProviderRowProps) => {
  const { provider, connection, orgSlug, t } = props;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 px-4 py-3 dark:border-neutral-800">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
            {renderProviderIcon(provider.providerId)}
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

export function OrgIntegrationsCard({
  orgSlug,
  lang,
  t,
}: OrgIntegrationsCardProps) {
  const utils = api.useUtils();
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const { data } = api.integration.list.useQuery({ orgSlug });

  const getAuthUrlMutation = api.integration.getAuthUrl.useMutation({
    onSuccess: ({ authUrl }) => {
      window.location.href = authUrl;
    },
    onError: (err) => toast.error(err.message),
  });

  const disconnectMutation = api.integration.disconnect.useMutation({
    onSuccess: () => {
      toast.success(t.disconnectedSuccessfully);
      setDisconnectingId(null);
      void utils.integration.list.invalidate({ orgSlug });
    },
    onError: (err) => toast.error(err.message),
  });

  const connections = data?.connections ?? [];
  const allProviders = data?.allProviders ?? [];

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
              isDisconnecting={disconnectingId === p.providerId}
              isDisconnectPending={disconnectMutation.isPending}
              isConnectPending={getAuthUrlMutation.isPending}
              t={t}
              onDisconnect={() => {
                setDisconnectingId(p.providerId);
                disconnectMutation.mutate({
                  orgSlug,
                  provider: p.providerId,
                });
              }}
              onConnect={() =>
                getAuthUrlMutation.mutate({
                  orgSlug,
                  provider: p.providerId,
                  lang,
                })
              }
            />
          );
        })}

        {allProviders.length === 0 && (
          <p className="text-[13px] text-neutral-500 dark:text-neutral-400">
            No integrations available.
          </p>
        )}
      </div>
    </SettingsCard>
  );
}
