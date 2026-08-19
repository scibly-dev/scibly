import { Input } from "@scibly/ui/components/input";
import { Label } from "@scibly/ui/components/label";
import { TagInput } from "@scibly/ui/components/tag-input";
import { Textarea } from "@scibly/ui/components/textarea";
import {
  type Control,
  Controller,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";

import { type CoursesTranslations } from "@/features/course-authoring/contracts";

import { type CourseEditFormValues } from "./course-edit-form";
import { CourseModeField } from "./course-mode-field";

export function CourseEditFields({
  control,
  errors,
  lessonCount,
  register,
  t,
}: {
  control: Control<CourseEditFormValues>;
  errors: FieldErrors<CourseEditFormValues>;
  lessonCount: number;
  register: UseFormRegister<CourseEditFormValues>;
  t: CoursesTranslations;
}) {
  return (
    <>
      <Controller
        control={control}
        name="mode"
        render={({ field }) => (
          <CourseModeField
            value={field.value}
            onChange={field.onChange}
            lockedReason={lessonCount > 1 ? t.mode.lockedByLessons : null}
            t={t}
          />
        )}
      />
      <div className="grid gap-2">
        <Label htmlFor="category">{t.detail.editSheet.fieldCategory}</Label>
        <Input
          id="category"
          {...register("category")}
          placeholder={t.detail.editSheet.fieldCategoryPlaceholder}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="title">{t.detail.editSheet.fieldTitle}</Label>
        <Input id="title" {...register("title")} />
        {errors.title && (
          <span className="text-sm text-red-500">{errors.title.message}</span>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">
          {t.detail.editSheet.fieldDescription}
        </Label>
        <Textarea
          id="description"
          {...register("description")}
          rows={4}
          className="resize-none"
        />
      </div>
      <div className="grid gap-2">
        <Label>{t.detail.editSheet.fieldTags}</Label>
        <Controller
          control={control}
          name="tags"
          render={({ field }) => (
            <TagInput
              value={field.value}
              onChange={field.onChange}
              placeholder={t.detail.editSheet.fieldTagsPlaceholder}
            />
          )}
        />
      </div>
    </>
  );
}
