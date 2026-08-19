"use client";

import type { OrgBillingPage } from "../../i18n/org-billing.types";

import { Loader2 } from "lucide-react";

import { api } from "@/shared/api/trpc/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/components/alert-dialog";

export function SeatPurchaseConfirmation({
  orgSlug,
  lang,
  t,
  quantity,
  pending,
  onCancel,
  onConfirm,
}: {
  orgSlug: string;
  lang: string;
  t: OrgBillingPage["seats"];

  quantity: number | null;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const preview = api.billing.previewLearnerSeats.useQuery(
    { orgSlug, quantity: quantity ?? 1 },
    { enabled: quantity !== null, staleTime: 0, retry: false },
  );
  const money = (cents: number) =>
    (cents / 100).toLocaleString(lang, { minimumFractionDigits: 2 });
  const quoted = preview.data;

  return (
    <AlertDialog
      open={quantity !== null}
      onOpenChange={(open) => !open && onCancel()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t.confirmTitle.replace(
              "{quantity}",
              (quantity ?? 0).toLocaleString(lang),
            )}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {quoted
              ? t.confirmChargeNow
                  .replace("{amount}", money(quoted.amountDueCents))
                  .replace("{quantity}", (quantity ?? 0).toLocaleString(lang))
              : preview.isError
                ? t.confirmFailed
                : t.confirmLoading}
          </AlertDialogDescription>
          {quoted ? (
            <p className="text-muted-foreground text-sm">
              {(quoted.periodEnd ? t.confirmRenewal : t.confirmRenewalNoDate)
                .replace(
                  "{date}",
                  quoted.periodEnd?.toLocaleDateString(lang, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }) ?? "",
                )
                .replace("{seats}", quoted.seatsAfter.toLocaleString(lang))
                .replace("{recurring}", money(quoted.recurringCents))}
            </p>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>
            {t.confirmCancel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
            disabled={!quoted || pending}
          >
            <span className="pointer-events-none flex items-center gap-2">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {quoted
                ? t.confirmAction.replace(
                    "{amount}",
                    money(quoted.amountDueCents),
                  )
                : t.confirmActionPending}
            </span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
