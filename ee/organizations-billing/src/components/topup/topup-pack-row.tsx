import type { OrgBillingPage } from "../../i18n/org-billing.types";

import {
  TOPUP_PACKS,
  type TopupPackKey,
} from "@scibly/ee-billing/topup-catalogue";
import { Button } from "@scibly/ui/components/button";
import { Loader2 } from "lucide-react";

import { formatCount } from "../../format-count";

export const TopupPackRow = ({
  pack,
  lang,
  t,
  onBuy,
  pending,
  disabled,
}: {
  pack: TopupPackKey;
  lang: string;
  t: OrgBillingPage["topup"];
  onBuy: () => void;
  pending: boolean;
  disabled: boolean;
}) => {
  const { credits, priceCents } = TOPUP_PACKS[pack];
  const n = formatCount(lang);

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-neutral-200/60 px-4 py-3 dark:border-neutral-800/60">
      <div className="flex flex-col">
        <span className="text-foreground text-[15px] font-medium">
          {t.packCredits.replace("{credits}", n(credits))}
        </span>
        <span className="text-muted-foreground text-[13px]">
          {t.packPrice.replace("{price}", n(priceCents / 100))} · {t.vatNote}
        </span>
      </div>
      <Button onClick={onBuy} disabled={disabled} size="sm">
        <span className="pointer-events-none flex items-center gap-2">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t.buyButton}
        </span>
      </Button>
    </div>
  );
};
