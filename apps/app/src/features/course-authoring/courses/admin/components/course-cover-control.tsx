"use client";

import { Button } from "@scibly/ui/components/button";
import { Popover, PopoverTrigger } from "@scibly/ui/components/popover";
import { ImageIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { type CoursesTranslations } from "@/features/course-authoring/contracts";
import { api } from "@/shared/api/trpc/client";
import FileUploadInput from "@/shared/content/editor/media/components/file-upload-input-popover";

import { invalidateCourseAdmin } from "../utils";

export function CourseCoverControl({
  courseId,
  thumbnail,
  t,
}: {
  courseId: string;
  thumbnail: string | null;
  t: CoursesTranslations;
}) {
  const utils = api.useUtils();
  const [open, setOpen] = useState(false);
  const update = api.course.update.useMutation({
    onSuccess: () => {
      toast.success(t.detail.editSheet.toastUpdateSuccess);
      invalidateCourseAdmin(utils, courseId);
    },
    onError: (error) =>
      toast.error(error.message || t.detail.editSheet.toastUpdateFailed),
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" disabled={update.isPending} className="gap-2">
          <ImageIcon className="h-4 w-4" />
          {thumbnail ? t.detail.coverLabel : t.detail.coverAdd}
        </Button>
      </PopoverTrigger>
      <FileUploadInput
        mediaType="image"
        useEditorBucket={false}
        setLoading={() => {}}
        setNewUrl={(url) => update.mutate({ courseId, thumbnail: url })}
        onUploadSuccess={() => setOpen(false)}
        initialUrl={thumbnail ?? ""}
        align="end"
        onRemove={
          thumbnail
            ? () => {
                update.mutate({ courseId, thumbnail: null });
                setOpen(false);
              }
            : undefined
        }
        removeLabel={t.detail.coverRemove}
      />
    </Popover>
  );
}
