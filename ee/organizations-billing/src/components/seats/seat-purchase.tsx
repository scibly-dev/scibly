"use client";

import type { OrgBillingPage } from "../../i18n/org-billing.types";

import { MAX_SEAT_PURCHASE } from "@scibly/ee-billing/plan-catalogue";
import { usePostHog } from "@scibly/observability/client";
import { SEAT_SHORTFALL_QUERY_PARAM } from "@scibly/routes";
import { Button } from "@scibly/ui/components/button";
import { Input } from "@scibly/ui/components/input";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { api } from "@/shared/api/trpc/client";

import { SeatPurchaseConfirmation } from "./seat-purchase-confirmation";
import { seatsFromQuery } from "./seats-from-query";

export const SeatPurchase = ({
  orgSlug,
  lang,
  t,
  sellable,
  priceCents,
}: {
  orgSlug: string;
  lang: string;
  t: OrgBillingPage["seats"];
  sellable: boolean;

  priceCents: number | null;
}) => {
  const searchParams = useSearchParams();
  const [quantity, setQuantity] = useState(() =>
    String(seatsFromQuery(searchParams.get(SEAT_SHORTFALL_QUERY_PARAM))),
  );

  const [confirming, setConfirming] = useState<number | null>(null);
  const utils = api.useUtils();
  const posthog = usePostHog();
  const purchase = api.billing.purchaseLearnerSeats.useMutation({
    onSuccess: ({ purchasedSeats }) => {
      setConfirming(null);
      toast.success(
        t.purchaseSuccess.replace(
          "{purchased}",
          purchasedSeats.toLocaleString(lang),
        ),
      );
      utils.billing.getUsageOverview.invalidate({ orgSlug });
      utils.billing.getFeatureAccess.invalidate({ orgSlug });
    },
    onError: () => {
      setConfirming(null);
      toast.error(t.purchaseFailed);
    },
  });

  if (!sellable || priceCents === null) {
    return (
      <p className="text-muted-foreground text-[13px]">{t.unavailableNote}</p>
    );
  }

  const price = (priceCents / 100).toLocaleString(lang, {
    minimumFractionDigits: 2,
  });

  return (
    <div className="flex w-full flex-col gap-2">
      <p className="text-muted-foreground text-[13px]">
        {t.pricePerSeat.replace("{price}", price)} · {t.vatNote}
      </p>
      <div className="flex items-end gap-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-muted-foreground text-[12px] font-medium">
            {t.quantityLabel}
          </span>
          <Input
            type="number"
            min={1}
            max={MAX_SEAT_PURCHASE}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="h-9 w-28"
          />
        </label>
        <Button
          onClick={() => setConfirming(seatsFromQuery(quantity))}
          disabled={purchase.isPending}
          size="sm"
        >
          <span className="pointer-events-none flex items-center gap-2">
            {purchase.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            {t.buyButton}
          </span>
        </Button>
      </div>
      <p className="text-muted-foreground text-[12px]">{t.prorationNote}</p>
      <SeatPurchaseConfirmation
        orgSlug={orgSlug}
        lang={lang}
        t={t}
        quantity={confirming}
        pending={purchase.isPending}
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          if (confirming === null) return;
          posthog.capture("checkout_started", {
            kind: "seats",
            quantity: confirming,
            orgSlug,
          });
          purchase.mutate({ orgSlug, quantity: confirming });
        }}
      />
    </div>
  );
};
