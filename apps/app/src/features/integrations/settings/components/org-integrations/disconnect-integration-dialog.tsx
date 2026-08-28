"use client";

import type { IntegrationProviderId } from "@/features/integrations/contracts";
import type { OrgSettingsPage } from "@/features/organizations/contracts";

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

// One instance for the whole card, not one per row: which provider is being
// asked about is the state, so there is nothing per-row to hold.
export function DisconnectIntegrationDialog({
  provider,
  isConfirming,
  onConfirm,
  onClose,
  t,
}: {
  /** The provider being asked about; non-null is what opens the dialog. */
  provider: IntegrationProviderId | null;
  isConfirming: boolean;
  onConfirm: () => void;
  onClose: () => void;
  t: OrgSettingsPage["integrations"];
}) {
  return (
    <AlertDialog
      open={Boolean(provider)}
      onOpenChange={(open: boolean) => !open && onClose()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.confirmDisconnectTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.confirmDisconnectDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t.cancelButton}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isConfirming}
            className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
          >
            {t.disconnectButton}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
