"use client";

import { Button } from "@scibly/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@scibly/ui/components/sheet";
import { Edit2 } from "lucide-react";

import { type CoursesTranslations } from "@/features/course-authoring/contracts";
import { useTranslation } from "@/i18n/hooks/use-translation";

import { CourseCompletionPolicyFields } from "./course-completion-policy-fields";
import { CourseDeleteDialog } from "./course-delete-dialog";
import { CourseEditActions } from "./course-edit-actions";
import { CourseEditFields } from "./course-edit-fields";
import {
  type CourseEditCourse,
  useCourseEditSheet,
} from "./use-course-edit-sheet";

interface CourseEditSheetProps {
  course: CourseEditCourse;

  lessonCount: number;
  orgSlug: string;
}

type CourseEditController = ReturnType<typeof useCourseEditSheet>;

export function CourseEditContent({
  controller,
  lessonCount,
  t,
}: {
  controller: CourseEditController;
  lessonCount: number;
  t: CoursesTranslations;
}) {
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = controller.form;
  return (
    <SheetContent className="border-hairline flex h-full w-[480px] flex-col border-l-2 p-0 sm:max-w-lg">
      <SheetHeader className="border-hairline border-b-2 px-6 pt-6 pb-4">
        <SheetTitle>{t.detail.editSheet.title}</SheetTitle>
        <SheetDescription>{t.detail.editSheet.description}</SheetDescription>
      </SheetHeader>
      <form
        id="course-edit-form"
        onSubmit={handleSubmit(controller.submit)}
        className="grid flex-1 content-start gap-6 overflow-y-auto px-6 py-4"
      >
        <CourseEditFields
          control={control}
          errors={errors}
          lessonCount={lessonCount}
          register={register}
          t={t}
        />
        <CourseCompletionPolicyFields control={control} t={t} />
      </form>
      <CourseEditActions
        t={t}
        isDeleting={controller.isDeleting}
        isUpdating={controller.updatePending}
        isDirty={controller.form.formState.isDirty}
        onDelete={() => controller.setShowDeleteDialog(true)}
        onCancel={controller.close}
      />
    </SheetContent>
  );
}

export function CourseEditSheet({
  course,
  lessonCount,
  orgSlug,
}: CourseEditSheetProps) {
  const { translations: t } = useTranslation("courses");
  const controller = useCourseEditSheet(course, orgSlug, t);
  return (
    <Sheet open={controller.open} onOpenChange={controller.openChange}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          title={t.detail.editSheet.triggerTooltip}
          className="h-10 w-10"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <CourseEditContent
        controller={controller}
        lessonCount={lessonCount}
        t={t}
      />
      <CourseDeleteDialog
        t={t}
        open={controller.showDeleteDialog}
        onOpenChange={(open) => {
          if (!open) controller.setDeleteConfirmText("");
          controller.setShowDeleteDialog(open);
        }}
        confirmText={controller.deleteConfirmText}
        onConfirmTextChange={controller.setDeleteConfirmText}
        isDeleting={controller.isDeleting}
        onDelete={controller.deleteCourse}
      />
    </Sheet>
  );
}
