"use client";

import type { RouterOutputs } from "@/shared/api/trpc/client";
import type { NotebookTranslations } from "../../i18n/notebook.types";

import { toast } from "sonner";

import { api } from "@/shared/api/trpc/client";

import { useCourseBuilderStore } from "../course-builder-store";
import { openCourseBuilderStudio } from "./open-course-builder-studio";

type Course = RouterOutputs["course"]["list"]["items"][number];
type CourseIdentity = Pick<Course, "id" | "title">;

export function useCoursePickerActions(params: {
  notebookId: string | undefined;
  orgSlug: string;
  title: string;
  labels: NotebookTranslations["studio"]["courseBuilder"];
  close: () => void;
  resetCreate: () => void;
}) {
  const openCourse = useCourseBuilderStore((state) => state.openCourse);
  const utils = api.useUtils();
  const { mutate: linkNotebook } = api.course.linkNotebook.useMutation({
    onSuccess: () => {
      if (!params.notebookId) return;
      void utils.notebook.getById.invalidate({
        orgSlug: params.orgSlug,
        notebookId: params.notebookId,
      });
      void utils.notebook.getMeta.invalidate({
        orgSlug: params.orgSlug,
        notebookId: params.notebookId,
      });
    },
  });
  const enterCourse = (course: CourseIdentity) => {
    openCourse({ course: { id: course.id, title: course.title } });
    openCourseBuilderStudio();
    params.close();
  };
  const open = (course: Course) => {
    if (!params.notebookId) {
      enterCourse(course);
      return;
    }
    linkNotebook(
      { courseId: course.id, notebookId: params.notebookId },
      {
        onSuccess: () => enterCourse(course),
        onError: (error) =>
          toast.error(error.message || params.labels.linkNotebookFailed),
      },
    );
  };
  const { mutate: createCourse, isPending: isCreating } =
    api.course.create.useMutation({
      onSuccess: (course) => {
        enterCourse(course);
        params.resetCreate();
      },
    });
  const create = () => {
    if (!params.title.trim()) return;
    createCourse({
      title: params.title.trim(),
      orgSlug: params.orgSlug,
      notebookId: params.notebookId,
    });
  };
  return { open, create, isCreating };
}
