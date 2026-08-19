"use client";

import type { OrgSettingsPage } from "../i18n/org-settings.types";
import type { useOrgAiConfigController } from "./use-org-ai-config-controller";

import { Button } from "@scibly/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@scibly/ui/components/dialog";

type OrgAiConfigController = ReturnType<typeof useOrgAiConfigController>;

interface DeleteModelDialogProps {
  t: OrgSettingsPage["aiConfig"];
  controller: Pick<
    OrgAiConfigController,
    "deleteTarget" | "setDeleteTarget" | "confirmDelete" | "isDeletePending"
  >;
}

export const DeleteModelDialog = ({
  t,
  controller,
}: DeleteModelDialogProps) => (
  <Dialog
    open={controller.deleteTarget !== null}
    onOpenChange={(open) => {
      if (!open) controller.setDeleteTarget(null);
    }}
  >
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{t.deleteConfirmTitle}</DialogTitle>
        <DialogDescription>
          {t.deleteConfirmDescription.replace(
            "{name}",
            controller.deleteTarget?.name ?? "",
          )}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter className="gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => controller.setDeleteTarget(null)}
        >
          {t.cancelButton}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          disabled={controller.isDeletePending}
          onClick={controller.confirmDelete}
        >
          {t.deleteConfirmButton}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
