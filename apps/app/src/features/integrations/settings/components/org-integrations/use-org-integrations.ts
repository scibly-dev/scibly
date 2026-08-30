"use client";

import type { IntegrationProviderId } from "@/features/integrations/contracts";
import type { OrgSettingsPage } from "@/features/organizations/contracts";

import { useState } from "react";
import { toast } from "sonner";

import { api } from "@/shared/api/trpc/client";

export function useOrgIntegrations({
  orgSlug,
  lang,
  t,
}: {
  orgSlug: string;
  lang: string;
  t: OrgSettingsPage["integrations"];
}) {
  const utils = api.useUtils();
  const [pendingDisconnect, setPendingDisconnect] =
    useState<IntegrationProviderId | null>(null);

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
      void utils.integration.list.invalidate({ orgSlug });
    },
    onError: (err) => toast.error(err.message),
    onSettled: () => setPendingDisconnect(null),
  });

  return {
    connections: data?.connections ?? [],
    allProviders: data?.allProviders ?? [],
    isConnectPending: getAuthUrlMutation.isPending,
    // Only the row being disconnected: one pending request must not put every other provider on the card into a spinner.
    isBusy: (provider: IntegrationProviderId) =>
      pendingDisconnect === provider && disconnectMutation.isPending,
    connect: (provider: IntegrationProviderId) =>
      getAuthUrlMutation.mutate({ orgSlug, provider, lang }),
    pendingDisconnect,
    askToDisconnect: setPendingDisconnect,
    cancelDisconnect: () => setPendingDisconnect(null),
    isConfirmingDisconnect: disconnectMutation.isPending,
    confirmDisconnect: () => {
      if (!pendingDisconnect) return;
      disconnectMutation.mutate({ orgSlug, provider: pendingDisconnect });
    },
  };
}
