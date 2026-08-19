"use client";

import type { OrgBillingPage } from "../../i18n/org-billing.types";

import {
  TOPUP_PACK_KEYS,
  type TopupPackKey,
} from "@scibly/ee-billing/topup-catalogue";
import { useState } from "react";
import { toast } from "sonner";

import { api } from "@/shared/api/trpc/client";
import { SettingsCard } from "@/shared/ui/settings-card";

import { TopupPackRow } from "./topup-pack-row";

export function TopupCard({
  orgSlug,
  lang,
  t,
}: {
  orgSlug: string;
  lang: string;
  t: OrgBillingPage["topup"];
}) {
  const { data: status } = api.billing.getStatus.useQuery({ orgSlug });
  const [pendingPack, setPendingPack] = useState<TopupPackKey | null>(null);
  const startCheckout = api.billing.startTopupCheckout.useMutation();

  const buy = (pack: TopupPackKey) => {
    setPendingPack(pack);
    startCheckout.mutate(
      { orgSlug, pack },
      {
        onSuccess: ({ url }) => {
          window.location.href = url;
        },
        onError: () => {
          toast.error(t.checkoutFailed);
          setPendingPack(null);
        },
      },
    );
  };

  if (!status) {
    return <SettingsCard title={t.title} description={t.description} />;
  }

  if (!status.topupSellable) {
    return (
      <SettingsCard title={t.title} description={t.unavailableDescription} />
    );
  }

  return (
    <SettingsCard
      title={t.title}
      description={t.description}
      footer={t.upgradeNote}
    >
      <div className="flex w-full flex-col gap-3">
        {TOPUP_PACK_KEYS.map((pack) => (
          <TopupPackRow
            key={pack}
            pack={pack}
            lang={lang}
            t={t}
            onBuy={() => buy(pack)}
            pending={pendingPack === pack}
            disabled={pendingPack !== null}
          />
        ))}
      </div>
    </SettingsCard>
  );
}
