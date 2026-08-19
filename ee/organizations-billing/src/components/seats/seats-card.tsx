"use client";

import type { LearnerSeatUsage } from "@scibly/api/entitlement";
import type { OrgBillingPage } from "../../i18n/org-billing.types";

import { api } from "@/shared/api/trpc/client";
import { SettingsCard } from "@/shared/ui/settings-card";

import { formatCount } from "../../format-count";
import { SeatPurchase } from "./seat-purchase";

export function SeatsCard({
  orgSlug,
  seats,
  lang,
  t,
}: {
  orgSlug: string;
  seats: LearnerSeatUsage;
  lang: string;
  t: OrgBillingPage["seats"];
}) {
  const n = formatCount(lang);
  const { data: status } = api.billing.getStatus.useQuery({ orgSlug });

  return (
    <SettingsCard
      title={t.title}
      description={t.description}
      footer={
        seats.capacity === 0
          ? t.none
          : t.included
              .replace("{included}", n(seats.included))
              .replace("{purchased}", n(seats.purchased))
      }
    >
      <div className="flex w-full flex-col gap-4">
        <p className="text-foreground text-[15px] font-medium">
          {t.usedOfCapacity
            .replace("{used}", n(seats.used))
            .replace("{capacity}", n(seats.capacity))}
        </p>
        {status && seats.capacity > 0 ? (
          <SeatPurchase
            orgSlug={orgSlug}
            lang={lang}
            t={t}
            sellable={status.seatsSellable}
            priceCents={status.extraSeatPriceCents}
          />
        ) : null}
      </div>
    </SettingsCard>
  );
}
