"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@scibly/ui/components/dialog";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { type CoursesTranslations } from "@/features/course-authoring/contracts";
import { api } from "@/shared/api/trpc/client";

import { CourseSharePanel } from "../../../enrollments/components/course-share-panel";
import { courseShareTarget } from "../../../enrollments/components/course-share-target";

// Sharing saves on the switch rather than a footer button, since an unsaved "on" would
// hand out a dead link before the setting is live.
export function CourseShareDialog({
  allowAnonymous,
  course,
  onOpenChange,
  open,
  t,
}: {
  allowAnonymous: boolean;
  course: { id: string; title: string };
  onOpenChange: (open: boolean) => void;
  open: boolean;
  t: CoursesTranslations;
}) {
  const copy = t.detail.share;
  const params = useParams<{ lang: string }>();
  const utils = api.useUtils();

  const [saving, setSaving] = useState<boolean | null>(null);
  const update = api.course.update.useMutation({
    onSuccess: async (_result, variables) => {
      toast.success(
        variables.allowAnonymous ? copy.toastEnabled : copy.toastDisabled,
      );
      await utils.course.getById.invalidate({ courseId: course.id });
      setSaving(null);
    },
    onError: (error) => {
      setSaving(null);
      toast.error(error.message || copy.toastFailed);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        <CourseSharePanel
          allowAnonymous={saving ?? allowAnonymous}
          isPending={update.isPending}
          onAllowAnonymousChange={(next) => {
            setSaving(next);
            update.mutate({ courseId: course.id, allowAnonymous: next });
          }}
          target={courseShareTarget(params.lang, course)}
          t={t}
        />
      </DialogContent>
    </Dialog>
  );
}
