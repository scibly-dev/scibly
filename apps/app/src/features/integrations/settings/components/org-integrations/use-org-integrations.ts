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
    disconnect: (provider: IntegrationProviderId) => {
      setDisconnectingId(provider);
      disconnectMutation.mutate({ orgSlug, provider });
    },
  };
}
