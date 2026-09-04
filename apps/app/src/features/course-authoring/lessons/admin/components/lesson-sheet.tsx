"use client";

import { Button } from "@scibly/ui/components/button";
import { Input } from "@scibly/ui/components/input";
import { Label } from "@scibly/ui/components/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@scibly/ui/components/sheet";
import { Textarea } from "@scibly/ui/components/textarea";
import { cn } from "@scibly/ui/utils";
import { Loader2 } from "lucide-react";
import { type ReactNode } from "react";
import { Controller } from "react-hook-form";

import {
  LESSON_DESCRIPTION_MAX_LENGTH,
  normalizeLessonDescriptionInput,
} from "@/shared/content/learning/lesson-description";

import {
  type LessonMetadataLesson,
  useLessonMetadataForm,
  type UseLessonMetadataFormParams,
} from "../hooks/use-lesson-metadata-form";
import { LessonIconPicker } from "./lesson-icon-picker";

type LessonForm = ReturnType<typeof useLessonMetadataForm>["form"];

export function LessonDescriptionField({
  form,
  sheetT,
}: {
  form: LessonForm;
  sheetT: ReturnType<typeof useLessonMetadataForm>["sheetT"];
}) {
  const description = form.watch("description") ?? "";
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="description">{sheetT.fieldDesc}</Label>
        <span
          className={cn(
            "text-xs tabular-nums",
            description.length === LESSON_DESCRIPTION_MAX_LENGTH
              ? "text-ink font-semibold"
              : "text-ink-faint",
          )}
        >
          {sheetT.fieldDescCounter
            .replace("{{current}}", String(description.length))
            .replace("{{max}}", String(LESSON_DESCRIPTION_MAX_LENGTH))}
        </span>
      </div>
      <Controller
        control={form.control}
        name="description"
        render={({ field }) => (
          <Textarea
            id="description"
            placeholder={sheetT.fieldDescPlaceholder}
            rows={4}
            maxLength={LESSON_DESCRIPTION_MAX_LENGTH}
            className="resize-none"
            value={field.value ?? ""}
            onBlur={field.onBlur}
            name={field.name}
            ref={field.ref}
            onChange={(event) =>
              field.onChange(
                normalizeLessonDescriptionInput(event.target.value),
              )
            }
          />
        )}
      />
      {form.formState.errors.description &&
      description.length > LESSON_DESCRIPTION_MAX_LENGTH ? (
        <span className="text-sm text-red-500">
          {sheetT.fieldDescTooLong.replace(
            "{{max}}",
            String(LESSON_DESCRIPTION_MAX_LENGTH),
          )}
        </span>
      ) : null}
    </div>
  );
}

export function LessonFormFields({
  form,
  isPending,
  sheetT,
}: {
  form: LessonForm;
  isPending: boolean;
  sheetT: ReturnType<typeof useLessonMetadataForm>["sheetT"];
}) {
  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="title">{sheetT.fieldTitle}</Label>
        <Input
          id="title"
          {...form.register("title")}
          placeholder={sheetT.fieldTitlePlaceholder}
        />
        {form.formState.errors.title ? (
          <span className="text-sm text-red-500">
            {form.formState.errors.title.message}
          </span>
        ) : null}
      </div>
      <div className="grid gap-2">
        <Label>{sheetT.fieldIcon}</Label>
        <Controller
          control={form.control}
          name="icon"
          render={({ field }) => (
            <LessonIconPicker
              value={field.value}
              onChange={field.onChange}
              labels={sheetT.iconLabels}
              disabled={isPending}
            />
          )}
        />
      </div>
      <LessonDescriptionField form={form} sheetT={sheetT} />
      <div className="grid gap-2">
        <Label htmlFor="estimatedTime">{sheetT.fieldTime}</Label>
        <Input
          id="estimatedTime"
          type="number"
          {...form.register("estimatedTimeToCompleteMinutes", {
            valueAsNumber: true,
          })}
        />
      </div>
    </>
  );
}

interface LessonSheetProps {
  courseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson?: LessonMetadataLesson;
  onUpdateSuccess?: UseLessonMetadataFormParams["onUpdateSuccess"];
  /** Lesson-wide settings that save themselves, so they sit outside the form. */
  designSlot?: ReactNode;
}

export function LessonSheet({
  courseId,
  open,
  onOpenChange,
  lesson,
  onUpdateSuccess,
  designSlot,
}: LessonSheetProps) {
  const { form, isEditing, isPending, submit, sheetT } = useLessonMetadataForm({
    courseId,
    lesson,
    onSuccess: () => onOpenChange(false),
    onUpdateSuccess,
  });

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen && !isEditing) {
      form.reset();
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        className="border-hairline flex h-full w-[400px] flex-col border-l-2 p-0 sm:max-w-md"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <SheetHeader className="border-hairline border-b-2 px-6 pt-6 pb-4">
          <SheetTitle>
            {isEditing ? sheetT.titleEdit : sheetT.titleCreate}
          </SheetTitle>
          <SheetDescription>
            {isEditing ? sheetT.descEdit : sheetT.descCreate}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <form
            id="lesson-form"
            onSubmit={submit}
            className="grid content-start gap-6 px-6 py-4"
          >
            <LessonFormFields
              form={form}
              isPending={isPending}
              sheetT={sheetT}
            />
          </form>
          {designSlot ? (
            <div className="border-hairline border-t-2">{designSlot}</div>
          ) : null}
        </div>
        <div className="border-hairline mt-auto flex justify-end gap-3 border-t-2 bg-white px-6 py-4">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            {sheetT.cancel}
          </Button>
          <Button
            type="submit"
            form="lesson-form"
            disabled={isPending || (!form.formState.isDirty && isEditing)}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isEditing ? sheetT.saveChanges : sheetT.createLesson}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export type LessonSheetTarget =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; lessonId: string };

export function lessonSheetTargetToOpen(target: LessonSheetTarget): boolean {
  return target.mode !== "closed";
}
