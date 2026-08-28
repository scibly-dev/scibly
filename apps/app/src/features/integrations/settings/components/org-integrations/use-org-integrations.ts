"use client";

import type { IntegrationProviderId } from "@/features/integrations/contracts";
import type { OrgSettingsPage } from "@/features/organizations/contracts";

import { useState } from "react";
import { toast } from "sonner";

import { api } from "@/shared/api/trpc/client";

// Everything the card does apart from rendering: what there is to show, and
// the two things a row can ask for.
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
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  // Which provider the confirmation is being asked about. One piece of state
  // for the whole card, so a second Disconnect click cannot open the dialog
  // still holding the last provider.
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
    // Settled, not success: a failure used to leave the row latched disabled,
    // so the user was told the disconnect failed and then could not retry it.
    onSettled: () => {
      setDisconnectingId(null);
      setPendingDisconnect(null);
    },
  });

  return {
    connections: data?.connections ?? [],
    allProviders: data?.allProviders ?? [],
    isConnectPending: getAuthUrlMutation.isPending,
    // A row's disconnect is out of reach while it is the one being
    // disconnected, and while any disconnect is in flight. The two windows
    // overlap but neither contains the other, so both are asked.
    isBusy: (provider: IntegrationProviderId) =>
      disconnectingId === provider || disconnectMutation.isPending,
    connect: (provider: IntegrationProviderId) =>
      getAuthUrlMutation.mutate({ orgSlug, provider, lang }),
    pendingDisconnect,
    askToDisconnect: setPendingDisconnect,
    cancelDisconnect: () => setPendingDisconnect(null),
    isConfirmingDisconnect: disconnectMutation.isPending,
    confirmDisconnect: () => {
      if (!pendingDisconnect) return;
      setDisconnectingId(pendingDisconnect);
      disconnectMutation.mutate({ orgSlug, provider: pendingDisconnect });
    },
  };
}
