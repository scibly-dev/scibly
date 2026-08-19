import type { DictionaryPages } from "@/i18n/types";

import { Button } from "@scibly/ui/components/button";
import { Loader2, Trash2 } from "lucide-react";

export function CourseEditActions({
  t,
  isDeleting,
  isUpdating,
  isDirty,
  onDelete,
  onCancel,
}: {
  t: DictionaryPages["courses"];
  isDeleting: boolean;
  isUpdating: boolean;
  isDirty: boolean;
  onDelete: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="border-hairline mt-auto flex items-center justify-between gap-3 border-t-2 bg-white px-6 py-4">
      <Button
        variant="ghost"
        className="text-[#e5484d] hover:bg-[#e5484d]/8 hover:text-[#c8353a]"
        onClick={onDelete}
        disabled={isDeleting || isUpdating}
        type="button"
      >
        {isDeleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="mr-2 h-4 w-4" />
        )}
        {t.detail.editSheet.deleteButton}
      </Button>
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isUpdating || isDeleting}
        >
          {t.detail.editSheet.cancel}
        </Button>
        <Button
          type="submit"
          form="course-edit-form"
          disabled={isUpdating || isDeleting || !isDirty}
        >
          {isUpdating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {t.detail.editSheet.saveChanges}
        </Button>
      </div>
    </div>
  );
}
