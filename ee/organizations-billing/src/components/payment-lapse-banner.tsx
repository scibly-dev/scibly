"use client";

import type { OrgBillingPage } from "../i18n/org-billing.types";

import { routes } from "@scibly/routes";
import { cn } from "@scibly/ui/utils";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

import { api } from "@/shared/api/trpc/client";

export type PaymentLapseCopy = OrgBillingPage["paymentLapse"];

export function PaymentLapseBanner({
  orgSlug,
  copy,
}: {
  orgSlug: string;
  copy: PaymentLapseCopy;
}) {
  const { data: status } = api.billing.getStatus.useQuery({ orgSlug });

  const payment = status?.payment;

  if (!status?.canManageBilling || !payment || payment.state === "current") {
    return null;
  }

  const lapsed = payment.state === "lapsed";
  const text = lapsed ? copy.lapsed : copy.grace;
  const deadline = payment.graceEndsAt
    ? new Date(payment.graceEndsAt).toLocaleDateString()
    : "";

  return (
    <div
      className={cn(
        "mb-6 flex w-full items-start gap-3 rounded-lg border p-4",
        lapsed
          ? "border-destructive/40 bg-destructive/10"
          : "border-amber-500/40 bg-amber-500/10",
      )}
      role="alert"
    >
      <AlertTriangle
        className={cn(
          "mt-0.5 h-5 w-5 shrink-0",
          lapsed ? "text-destructive" : "text-amber-600",
        )}
        aria-hidden
      />
      <div className="flex flex-col gap-1">
        <h3 className="text-foreground text-[16px] font-semibold tracking-tight">
          {text.title}
        </h3>
        <p className="text-muted-foreground text-[14px]">
          {/* The deadline as a date, from the same clock the refusals
          read — a warning without one is a warning without urgency. */}
          {text.description.replace("{date}", deadline)}
        </p>
        <p className="mt-1 text-[14px] font-medium">
          <Link
            href={routes.app.profile.org(orgSlug).billing}
            className="text-foreground underline-offset-4 hover:underline"
          >
            {copy.billingLink}
          </Link>
        </p>
      </div>
    </div>
  );
}
