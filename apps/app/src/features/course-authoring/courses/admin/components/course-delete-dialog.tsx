import type { DictionaryPages } from "@/i18n/types";

import { Button } from "@scibly/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@scibly/ui/components/dialog";
import { Input } from "@scibly/ui/components/input";
import { Loader2, Trash2 } from "lucide-react";

export function CourseDeleteDialog({
  t,
  open,
  onOpenChange,
  confirmText,
  onConfirmTextChange,
  isDeleting,
  onDelete,
}: {
  t: DictionaryPages["courses"];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  confirmText: string;
  onConfirmTextChange: (value: string) => void;
  isDeleting: boolean;
  onDelete: () => void;
}) {
  const confirmValue = t.detail.deleteDialog.confirmValue;
  const instruction =
    t.detail.deleteDialog.confirmInstruction.split(confirmValue);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-600">
            {t.detail.deleteDialog.title}
          </DialogTitle>
          <DialogDescription>
            {t.detail.deleteDialog.description}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-ink-muted mb-2 text-sm">
            {instruction[0]}
            <span className="font-semibold select-all">{confirmValue}</span>
            {instruction[1]}
          </p>
          <Input
            value={confirmText}
            onChange={(event) => onConfirmTextChange(event.target.value)}
            placeholder={t.detail.deleteDialog.confirmPlaceholder}
            className="mt-2"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            {t.detail.deleteDialog.cancel}
          </Button>
          <Button
            variant="destructive"
            onClick={onDelete}
            disabled={
              isDeleting ||
              confirmText.toLowerCase() !== confirmValue.toLowerCase()
            }
            className="gap-2"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {t.detail.deleteDialog.deleteButton}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
