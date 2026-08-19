"use client";

import type { OrgSettingsPage } from "@/features/organizations/contracts";

import { Button } from "@scibly/ui/components/button";
import {
  CheckCircle2,
  ExternalLink,
  Plug,
  Unplug,
  XCircle,
} from "lucide-react";
import { useState } from "react";
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

const PROVIDER_ICONS = new Map<
  string,
  React.ComponentType<{ className?: string }>
>([["NOTION", NotionIcon]]);

function renderProviderIcon(providerId: string) {
  const IconComponent = PROVIDER_ICONS.get(providerId);
  return IconComponent ? (
    <IconComponent className="h-4 w-4 text-neutral-800 dark:text-neutral-200" />
  ) : (
    <Plug className="h-4 w-4 text-neutral-500" />
  );
}

interface OrgIntegrationsCardProps {
  orgSlug: string;
  lang: string;
  t: OrgSettingsPage["integrations"];
}

type ProviderRowProps = {
  provider: { providerId: string; displayName: string };
  connection?: { workspaceName: string | null };
  isDisconnecting: boolean;
  isConnectPending: boolean;
  isDisconnectPending: boolean;
  t: OrgSettingsPage["integrations"];
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

export const ProviderRow = (props: ProviderRowProps) => {
  const { provider, connection, t } = props;

  const providerLabels: Record<string, string> = t.providers;
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-neutral-200 px-4 py-3 dark:border-neutral-800">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
          {renderProviderIcon(provider.providerId)}
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
            {providerLabels[provider.providerId] ?? provider.displayName}
          </p>
          <ProviderStatus connection={connection} t={t} />
        </div>
      </div>
      <div className="shrink-0">
        <ProviderAction {...props} />
      </div>
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
