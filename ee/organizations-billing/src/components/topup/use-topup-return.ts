"use client";

import type { OrgBillingPage } from "../../i18n/org-billing.types";

import { TOPUP_SESSION_QUERY_PARAM } from "@scibly/routes";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { api } from "@/shared/api/trpc/client";

export function useTopupReturn(orgSlug: string, t: OrgBillingPage["topup"]) {
  const utils = api.useUtils();
  const { mutate } = api.billing.claimTopupPurchase.useMutation();

  const claimedSessionId = useRef<string | null>(null);

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get(
      TOPUP_SESSION_QUERY_PARAM,
    );
    if (!sessionId || claimedSessionId.current === sessionId) return;
    claimedSessionId.current = sessionId;

    mutate(
      { orgSlug, sessionId },
      {
        onSuccess: ({ granted }) => {
          toast.success(granted ? t.purchaseConfirmed : t.purchasePending);
          void utils.billing.getUsageOverview.invalidate({ orgSlug });
          void utils.billing.getStatus.invalidate({ orgSlug });

          void utils.billing.getAllowanceWarning.invalidate({ orgSlug });
          void utils.billing.getGenerationBalance.invalidate({ orgSlug });
        },

        onError: () => toast.message(t.purchasePending),
        onSettled: () =>
          window.history.replaceState(null, "", window.location.pathname),
      },
    );
  }, [mutate, orgSlug, t, utils]);
}
