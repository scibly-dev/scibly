"use client";

import type { WorkspaceLayoutCompositionProps } from "./workspace-layout.types";

import { routes } from "@scibly/routes";
import { buttonVariants } from "@scibly/ui/components/button";

import { api } from "@/shared/api/trpc/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/components/alert-dialog";

export function OutOfCreditsDialog({
  open,
  orgSlug,
  onAcknowledge,
  t,
}: {
  open: boolean;
  orgSlug: string;
  onAcknowledge: () => void;
  t: WorkspaceLayoutCompositionProps["t"];
}) {
  const { data: status } = api.billing.getStatus.useQuery(
    { orgSlug },
    { enabled: open && Boolean(orgSlug) },
  );
  const canManageBilling = status?.canManageBilling === true;
  const copy = t.chat.outOfCredits;

  return (
    <AlertDialog open={open}>
      {/* Only Escape needs blocking to keep this a must-acknowledge dialog. */}
      <AlertDialogContent onEscapeKeyDown={(event) => event.preventDefault()}>
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {canManageBilling ? copy.manageDescription : copy.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {canManageBilling ? (
            <a
              href={routes.app.profile.org(orgSlug).billing}
              className={buttonVariants({ variant: "outline" })}
            >
              {copy.billingLinkLabel}
            </a>
          ) : null}
          <AlertDialogAction onClick={onAcknowledge}>
            {copy.acknowledgeLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
