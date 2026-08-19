"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LessonIcon } from "@scibly/db/enums";
import { useEffect } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { type CoursesTranslations } from "@/features/course-authoring/contracts";
import { useTranslation } from "@/i18n/hooks/use-translation";
import { api } from "@/shared/api/trpc/client";
import { normalizeLessonIcon } from "@/shared/content/course/lesson-icons";
import {
  LESSON_DESCRIPTION_MAX_LENGTH,
  lessonDescriptionSchema,
  normalizeLessonDescriptionInput,
} from "@/shared/content/learning/lesson-description";

import { invalidateCourseAdmin } from "../../../courses/admin/utils";

const lessonMetadataFormSchema = z.object({
  title: z.string().min(1),
  description: lessonDescriptionSchema.optional(),
  icon: z.nativeEnum(LessonIcon),
  estimatedTimeToCompleteMinutes: z.number().min(0),
});

type LessonMetadataFormValues = z.infer<typeof lessonMetadataFormSchema>;

export interface LessonMetadataLesson {
  id: string;
  title: string;
  description: string | null;
  icon?: LessonIcon | null;
  estimatedTimeToCompleteMinutes: number;
}

export interface UseLessonMetadataFormParams {
  courseId: string;
  lesson?: LessonMetadataLesson;
  onSuccess?: () => void;
  onUpdateSuccess?: (variables: {
    courseId: string;
    lessonId: string;
    title?: string;
    description?: string;
    icon?: LessonIcon;
    estimatedTimeToCompleteMinutes?: number;
  }) => void;
}

export type LessonMetadataUpdateVariables = Parameters<
  NonNullable<UseLessonMetadataFormParams["onUpdateSuccess"]>
>[0];

function lessonFormValues(
  lesson?: LessonMetadataLesson,
): LessonMetadataFormValues {
  return {
    title: lesson?.title ?? "",
    description: (lesson?.description ?? "").slice(
      0,
      LESSON_DESCRIPTION_MAX_LENGTH,
    ),
    icon: normalizeLessonIcon(lesson?.icon),
    estimatedTimeToCompleteMinutes: lesson?.estimatedTimeToCompleteMinutes ?? 0,
  };
}

function useLessonMetadataMutations({
  courseId,
  form,
  onSuccess,
  onUpdateSuccess,
  sheetT,
}: UseLessonMetadataFormParams & {
  form: UseFormReturn<LessonMetadataFormValues>;
  sheetT: CoursesTranslations["detail"]["lessonSheet"];
}) {
  const utils = api.useUtils();
  const create = api.course.createLesson.useMutation({
    onSuccess: () => {
      toast.success(sheetT.toastCreateSuccess);
      form.reset();
      invalidateCourseAdmin(utils, courseId);
      onSuccess?.();
    },
    onError: (error) => toast.error(error.message || sheetT.toastCreateError),
  });
  const update = api.course.updateLesson.useMutation({
    onSuccess: (_data, variables) => {
      toast.success(sheetT.toastUpdateSuccess);
      invalidateCourseAdmin(utils, courseId);
      onUpdateSuccess?.(variables);
      onSuccess?.();
    },
    onError: (error) => toast.error(error.message || sheetT.toastUpdateError),
  });
  return { create, update };
}

export function useLessonMetadataForm({
  courseId,
  lesson,
  onSuccess,
  onUpdateSuccess,
}: UseLessonMetadataFormParams) {
  const { translations: t } = useTranslation("courses");
  const sheetT = t.detail.lessonSheet;
  const isEditing = !!lesson;

  const form = useForm<LessonMetadataFormValues>({
    resolver: zodResolver(lessonMetadataFormSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: lessonFormValues(lesson),
  });

  useEffect(() => {
    if (isEditing && lesson) {
      form.reset(lessonFormValues(lesson));
    }
  }, [lesson, form, isEditing]);

  const mutations = useLessonMetadataMutations({
    courseId,
    form,
    onSuccess,
    onUpdateSuccess,
    sheetT,
  });

  const submit = form.handleSubmit((data) => {
    const description = data.description
      ? normalizeLessonDescriptionInput(data.description)
      : "";
    const normalizedDescription = description || undefined;

    if (isEditing) {
      if (!form.formState.isDirty) {
        onSuccess?.();
        return;
      }
      mutations.update.mutate({
        courseId,
        lessonId: lesson!.id,
        title: data.title,
        description: normalizedDescription,
        icon: data.icon,
        estimatedTimeToCompleteMinutes: data.estimatedTimeToCompleteMinutes,
      });
      return;
    }

    mutations.create.mutate({
      courseId,
      title: data.title,
      description: normalizedDescription,
      icon: data.icon,
      estimatedTimeToCompleteMinutes: data.estimatedTimeToCompleteMinutes,
    });
  });

  const isPending = mutations.create.isPending || mutations.update.isPending;

  return {
    form,
    isEditing,
    isPending,
    submit,
    sheetT,
  };
}
