"use client";

import type { DictionaryPages } from "@/i18n/types";

import { authClient } from "@scibly/auth/client";
import { toast } from "sonner";

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

export function CancelInvitationDialog({
  invitationId,
  orgId,
  onClose,
  t,
}: {
  invitationId: string | null;
  orgId: string;
  onClose: () => void;
  t: DictionaryPages["orgMembers"];
}) {
  const trpcUtils = api.useUtils();

  const handleCancelInvitation = async () => {
    if (!invitationId) return;
    const { error } = await authClient.organization.cancelInvitation({
      invitationId,
    });

    onClose();

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t.invitations.cancelSuccess);
      void trpcUtils.organization.listMembersAndInvitations.invalidate({
        organizationId: orgId,
      });
    }
  };

  return (
    <AlertDialog
      open={!!invitationId}
      onOpenChange={(open: boolean) => !open && onClose()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.invitations.cancel}</AlertDialogTitle>
          <AlertDialogDescription>{t.areYouSure}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancelInvitation}
            className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
          >
            {t.invitations.cancel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
