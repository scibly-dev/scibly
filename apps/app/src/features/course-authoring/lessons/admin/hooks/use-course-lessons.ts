import {
  type DragEndEvent,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useState } from "react";
import { toast } from "sonner";

import { type CoursesTranslations } from "@/features/course-authoring/contracts";
import { useTranslation } from "@/i18n/hooks/use-translation";
import { api } from "@/shared/api/trpc/client";

import { invalidateCourseAdmin } from "../../../courses/admin/utils";

interface UseCourseLessonsProps {
  courseId: string;
}

type ContentTranslations = CoursesTranslations["detail"]["contentTab"];

function useLessonOrderMutation(
  courseId: string,
  contentT: ContentTranslations,
) {
  const utils = api.useUtils();
  return api.course.updateLessonOrder.useMutation({
    onMutate: async (newOrder) => {
      await utils.course.listLessons.cancel({ courseId, limit: 100 });
      const previousData = utils.course.listLessons.getData({
        courseId,
        limit: 100,
      });
      if (previousData) {
        const items = [...previousData.items].sort(
          (left, right) =>
            newOrder.lessonIds.indexOf(left.id) -
            newOrder.lessonIds.indexOf(right.id),
        );
        utils.course.listLessons.setData(
          { courseId, limit: 100 },
          { ...previousData, items },
        );
      }
      return { previousData };
    },
    onSuccess: () => toast.success(contentT.toastReorderSuccess),
    onError: (_error, _order, context) => {
      toast.error(contentT.toastReorderError);
      if (context?.previousData) {
        utils.course.listLessons.setData(
          { courseId, limit: 100 },
          context.previousData,
        );
      }
    },
  });
}

function useDeleteLessonMutation(
  courseId: string,
  contentT: ContentTranslations,
  onSettled: () => void,
) {
  const utils = api.useUtils();
  return api.course.deleteLesson.useMutation({
    onMutate: async ({ lessonIds }) => {
      await utils.course.listLessons.cancel({ courseId, limit: 100 });
      const previousData = utils.course.listLessons.getData({
        courseId,
        limit: 100,
      });
      if (previousData) {
        utils.course.listLessons.setData(
          { courseId, limit: 100 },
          {
            ...previousData,
            items: previousData.items.filter(
              (item) => !lessonIds.includes(item.id),
            ),
          },
        );
      }
      return { previousData };
    },
    onSuccess: () => {
      toast.success(contentT.toastDeleteSuccess);
      invalidateCourseAdmin(utils, courseId);
    },
    onError: (_error, _lesson, context) => {
      toast.error(contentT.toastDeleteError);
      if (context?.previousData) {
        utils.course.listLessons.setData(
          { courseId, limit: 100 },
          context.previousData,
        );
      }
    },
    onSettled,
  });
}

export function useCourseLessons({ courseId }: UseCourseLessonsProps) {
  const { translations: t } = useTranslation("courses");
  const contentT = t.detail.contentTab;

  const [lessonToDelete, setLessonToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data: lessonsData, isLoading: isLessonsLoading } =
    api.course.listLessons.useQuery({
      courseId,
      limit: 100,
    });

  const lessons = lessonsData?.items || [];

  const { mutate: updateLessonOrder } = useLessonOrderMutation(
    courseId,
    contentT,
  );
  const { mutate: deleteLessonMutation } = useDeleteLessonMutation(
    courseId,
    contentT,
    () => setLessonToDelete(null),
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = lessons.findIndex((item) => item.id === active.id);
      const newIndex = lessons.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(lessons, oldIndex, newIndex);

      updateLessonOrder({
        courseId,
        lessonIds: newItems.map((item) => item.id),
      });
    }
  };

  const deleteLesson = (lessonId: string) => {
    deleteLessonMutation({ courseId, lessonIds: [lessonId] });
  };

  return {
    lessons,
    isLessonsLoading,
    activeId,
    sensors,
    handleDragStart,
    handleDragEnd,
    lessonToDelete,
    setLessonToDelete,
    deleteLesson,
  };
}
