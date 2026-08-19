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

export function RemoveMemberDialog({
  memberId,
  orgId,
  onClose,
  t,
}: {
  memberId: string | null;
  orgId: string;
  onClose: () => void;
  t: DictionaryPages["orgMembers"];
}) {
  const trpcUtils = api.useUtils();

  const handleRemoveMember = async () => {
    if (!memberId) return;
    const { error } = await authClient.organization.removeMember({
      memberIdOrEmail: memberId,
      organizationId: orgId,
    });

    onClose();

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t.removeSuccess);
      void trpcUtils.organization.listMembersAndInvitations.invalidate({
        organizationId: orgId,
      });
    }
  };

  return (
    <AlertDialog
      open={!!memberId}
      onOpenChange={(open: boolean) => !open && onClose()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.table.removeMember}</AlertDialogTitle>
          <AlertDialogDescription>{t.areYouSure}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRemoveMember}
            className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
          >
            {t.remove}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
