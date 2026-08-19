"use client";

import type { OrgBillingPage } from "../i18n/org-billing.types";

import { BILLING_SEATS_ANCHOR } from "@scibly/routes";

import { api } from "@/shared/api/trpc/client";

import { AllowanceWarningCard } from "./allowance-warning-card";
import { BillingCard } from "./billing-card";
import { SeatsCard } from "./seats/seats-card";
import { SpendBreakdownCard } from "./spend/spend-breakdown-card";
import { TopupCard } from "./topup/topup-card";
import { useTopupReturn } from "./topup/use-topup-return";
import { UsageCard } from "./usage/usage-card";

export function BillingOverview({
  orgId,
  orgSlug,
  lang,
  t,
}: {
  orgId: string;
  orgSlug: string;
  lang: string;
  t: OrgBillingPage;
}) {
  const { data: overview } = api.billing.getUsageOverview.useQuery({ orgSlug });
  useTopupReturn(orgSlug, t.topup);

  return (
    <div className="flex w-full flex-col gap-6">
      <AllowanceWarningCard
        orgSlug={orgSlug}
        lang={lang}
        t={t.allowanceWarning}
      />
      {overview ? (
        <>
          <UsageCard
            generations={overview.generations}
            lang={lang}
            t={t.usage}
          />
          <SpendBreakdownCard
            spend={overview.spend}
            topupUsed={overview.generations.topupUsed}
            lang={lang}
            t={t.breakdown}
          />
          {overview.seats ? (
            <div id={BILLING_SEATS_ANCHOR} className="scroll-mt-8">
              <SeatsCard
                orgSlug={orgSlug}
                seats={overview.seats}
                lang={lang}
                t={t.seats}
              />
            </div>
          ) : null}
        </>
      ) : null}
      <div id="topup" className="scroll-mt-8">
        <TopupCard orgSlug={orgSlug} lang={lang} t={t.topup} />
      </div>
      <div id="plans" className="scroll-mt-8">
        <BillingCard orgId={orgId} orgSlug={orgSlug} lang={lang} t={t.plan} />
      </div>
    </div>
  );
}
