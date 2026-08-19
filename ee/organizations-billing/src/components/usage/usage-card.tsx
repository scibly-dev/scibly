"use client";

import type { BillingUsageOverview } from "../../api/usage-overview.operations";
import type { OrgBillingPage } from "../../i18n/org-billing.types";

import { SettingsCard } from "@/shared/ui/settings-card";

import { formatCount } from "../../format-count";
import { Legend } from "./legend";
import { TOPUP_TONE, UsageBar } from "./usage-bar";

export function UsageCard({
  generations,
  lang,
  t,
}: {
  generations: BillingUsageOverview["generations"];
  lang: string;
  t: OrgBillingPage["usage"];
}) {
  const {
    allowance,
    used,
    allowanceRemaining,
    topupRemaining,
    topupUsed,
    total,
    totalUsed,
    remaining,
    resetsAt,
  } = generations;
  const n = formatCount(lang);

  const allowanceShare = allowance > 0 ? Math.min(1, used / allowance) : 0;
  const tone =
    allowanceShare >= 0.95
      ? "bg-[#e5484d]"
      : allowanceShare >= 0.8
        ? "bg-amber-500"
        : "bg-[#0066FF]";
  const hasTopup = topupRemaining > 0 || topupUsed > 0;

  return (
    <SettingsCard
      title={t.title}
      description={t.description}
      footer={
        resetsAt
          ? t.resetsAt.replace(
              "{date}",
              new Intl.DateTimeFormat(lang, { dateStyle: "long" }).format(
                resetsAt,
              ),
            )
          : t.noReset
      }
    >
      <div className="flex w-full flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-ink text-[15px] font-semibold">
            {generations.unlimited
              ? t.unlimited
              : t.usedOfTotal
                  .replace("{used}", n(totalUsed))
                  .replace("{total}", n(total))}
          </span>
          {generations.unlimited ? null : (
            <span className="text-ink-muted text-[14px]">
              {t.remaining.replace("{remaining}", n(remaining))}
            </span>
          )}
        </div>
        {generations.unlimited ? null : (
          <>
            <UsageBar
              allowanceUsed={used}
              topupUsed={topupUsed}
              allowanceRemaining={allowanceRemaining}
              topupRemaining={topupRemaining}
              tone={tone}
            />
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13px]">
              <Legend swatch={tone}>
                {t.allowanceLegend
                  .replace("{remaining}", n(allowanceRemaining))
                  .replace("{allowance}", n(allowance))}
              </Legend>
              {hasTopup ? (
                <Legend swatch={TOPUP_TONE}>
                  {(topupUsed > 0 ? t.topupLegendSpent : t.topupLegend)
                    .replace("{remaining}", n(topupRemaining))
                    .replace("{used}", n(topupUsed))}
                </Legend>
              ) : null}
            </div>
          </>
        )}
      </div>
    </SettingsCard>
  );
}
