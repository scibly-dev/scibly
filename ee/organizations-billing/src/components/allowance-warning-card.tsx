"use client";

import type { OrgBillingPage } from "../i18n/org-billing.types";

import { cn } from "@scibly/ui/utils";
import { AlertTriangle, X } from "lucide-react";
import { useSyncExternalStore } from "react";

import { api } from "@/shared/api/trpc/client";

import {
  dismissalKey,
  isDismissed,
  recordDismissal,
  subscribeToDismissals,
} from "../dismissals";
import { formatCount } from "../format-count";

export function AllowanceWarningCard({
  orgSlug,
  lang,
  t,
}: {
  orgSlug: string;
  lang: string;
  t: OrgBillingPage["allowanceWarning"];
}) {
  const { data: status } = api.billing.getStatus.useQuery({ orgSlug });
  const { data: warning } = api.billing.getAllowanceWarning.useQuery(
    { orgSlug },
    { enabled: status?.canManageBilling === true },
  );

  const key = warning
    ? dismissalKey(orgSlug, warning.periodKey, warning.threshold)
    : null;

  const dismissed = useSyncExternalStore(
    subscribeToDismissals,
    () => key !== null && isDismissed(key),

    () => true,
  );

  if (!warning || !key || dismissed) return null;

  const urgent = warning.threshold === 95;
  const copy = urgent ? t.critical : t.warning;
  const n = formatCount(lang);

  return (
    <div
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border p-4",
        urgent
          ? "border-destructive/40 bg-destructive/10"
          : "border-amber-500/40 bg-amber-500/10",
      )}
      role="status"
    >
      <AlertTriangle
        className={cn(
          "mt-0.5 h-5 w-5 shrink-0",
          urgent ? "text-destructive" : "text-amber-600",
        )}
        aria-hidden
      />
      <div className="flex flex-col gap-1">
        <h3 className="text-foreground text-[16px] font-semibold tracking-tight">
          {copy.title}
        </h3>
        <p className="text-muted-foreground text-[14px]">
          {copy.description
            .replace("{remaining}", n(warning.remaining))
            .replace("{allowance}", n(warning.allowance))}
        </p>
        {/* Both cards are already on this page, so these scroll rather than navigate. */}
        <p className="mt-1 flex flex-wrap gap-x-4 text-[14px] font-medium">
          <a
            href="#topup"
            className="text-foreground underline-offset-4 hover:underline"
          >
            {t.topupLink}
          </a>
          <a
            href="#plans"
            className="text-foreground underline-offset-4 hover:underline"
          >
            {t.plansLink}
          </a>
        </p>
      </div>
      <button
        type="button"
        onClick={() => recordDismissal(key)}
        aria-label={t.dismiss}
        className="text-muted-foreground hover:text-foreground ml-auto shrink-0 rounded-md p-1"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
