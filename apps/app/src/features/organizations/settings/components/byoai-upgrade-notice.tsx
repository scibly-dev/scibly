"use client";

import type { GateDecision } from "@/features/organizations/contracts";
import type { OrgSettingsPage } from "../i18n/org-settings.types";

import { Lock } from "lucide-react";

export function ByoaiUpgradeNotice({
  access,
  hasEndpoints,
  t,
}: {
  access: GateDecision;
  hasEndpoints: boolean;
  t: OrgSettingsPage["aiConfig"];
}) {
  const lapsed = access.reason === "lapsed";
  const description = lapsed
    ? t.byoaiLapsedDescription
    : t.byoaiLockedDescription.replaceAll(
        "{plan}",
        access.requiredPlan ?? t.byoaiLockedFallbackPlan,
      );

  return (
    <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-300/70 bg-amber-50/70 px-4 py-3 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
      <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-[13px] font-medium">
          {lapsed
            ? t.byoaiLapsedTitle
            : t.byoaiLockedTitle.replaceAll(
                "{plan}",
                access.requiredPlan ?? t.byoaiLockedFallbackPlan,
              )}
        </p>
        <p className="text-[12px] leading-relaxed">{description}</p>
        {hasEndpoints ? (
          <p className="text-[12px] leading-relaxed opacity-80">
            {t.byoaiLockedRemovalNote}
          </p>
        ) : null}
      </div>
    </div>
  );
}
