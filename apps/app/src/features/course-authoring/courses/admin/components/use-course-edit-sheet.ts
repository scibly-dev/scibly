import type { CourseMode } from "@scibly/db/enums";

import { zodResolver } from "@hookform/resolvers/zod";
import { routes } from "@scibly/routes";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { type CoursesTranslations } from "@/features/course-authoring/contracts";
import { api } from "@/shared/api/trpc/client";

import { invalidateCourseAdmin } from "../utils";
import {
  type CourseEditFormValues,
  createCourseEditFormSchema,
} from "./course-edit-form";

export interface CourseEditCourse {
  id: string;
  mode: CourseMode;
  title: string;
  description: string | null;
  category: string | null;
  tags: string[];
  passingScorePct: number | null;
  maxTries: number | null;
}

function defaultValues(course: CourseEditCourse): CourseEditFormValues {
  return {
    mode: course.mode,
    title: course.title,
    description: course.description || "",
    category: course.category || "",
    tags: course.tags || [],
    passingScorePct: course.passingScorePct,
    maxTries: course.maxTries,
  };
}

function useCourseEditMutations(
  course: CourseEditCourse,
  orgSlug: string,
  t: CoursesTranslations,
  setOpen: (open: boolean) => void,
  setIsDeleting: (deleting: boolean) => void,
) {
  const router = useRouter();
  const trpcUtils = api.useUtils();
  const update = api.course.update.useMutation({
    onSuccess: () => {
      toast.success(t.detail.editSheet.toastUpdateSuccess);
      setOpen(false);
      invalidateCourseAdmin(trpcUtils, course.id);
    },
    onError: (error) =>
      toast.error(error.message || t.detail.editSheet.toastUpdateFailed),
  });
  const remove = api.course.delete.useMutation({
    onSuccess: () => {
      toast.success(t.detail.editSheet.toastDeleteSuccess);
      setOpen(false);
      router.push(routes.app.profile.org(orgSlug).courses.root);
    },
    onError: (error) => {
      toast.error(error.message || t.detail.editSheet.toastDeleteFailed);
      setIsDeleting(false);
    },
  });
  return { remove, update };
}

export function useCourseEditSheet(
  course: CourseEditCourse,
  orgSlug: string,
  t: CoursesTranslations,
) {
  const [open, setOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const form = useForm<CourseEditFormValues>({
    resolver: zodResolver(
      createCourseEditFormSchema(t.detail.editSheet.titleRequired),
    ),
    defaultValues: defaultValues(course),
  });
  useEffect(() => form.reset(defaultValues(course)), [course, form]);

  const mutations = useCourseEditMutations(
    course,
    orgSlug,
    t,
    setOpen,
    setIsDeleting,
  );
  return {
    deleteConfirmText,
    form,
    isDeleting,
    open,
    setDeleteConfirmText,
    setShowDeleteDialog,
    showDeleteDialog,
    updatePending: mutations.update.isPending,
    close: () => {
      setOpen(false);
      form.reset();
      setShowDeleteDialog(false);
      setDeleteConfirmText("");
    },
    deleteCourse: () => {
      if (
        deleteConfirmText.toLowerCase() !==
        t.detail.deleteDialog.confirmValue.toLowerCase()
      ) {
        return;
      }
      setIsDeleting(true);
      mutations.remove.mutate({ courseId: course.id });
    },
    openChange: (nextOpen: boolean) => {
      if (nextOpen) setOpen(true);
      else {
        setOpen(false);
        form.reset();
        setShowDeleteDialog(false);
        setDeleteConfirmText("");
      }
    },
    submit: (data: CourseEditFormValues) => {
      if (!form.formState.isDirty) {
        setOpen(false);
        return;
      }
      mutations.update.mutate({
        courseId: course.id,
        ...data,
        description: data.description || undefined,
        category: data.category || undefined,
      });
    },
  };
}
