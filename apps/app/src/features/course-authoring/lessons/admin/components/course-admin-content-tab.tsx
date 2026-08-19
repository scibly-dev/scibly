"use client";

import {
  closestCenter,
  defaultDropAnimationSideEffects,
  DndContext,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@scibly/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@scibly/ui/components/dialog";
import { PlayCircle, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { type CoursesTranslations } from "@/features/course-authoring/contracts";
import { useTranslation } from "@/i18n/hooks/use-translation";
import { api } from "@/shared/api/trpc/client";
import { DisabledReasonTooltip } from "@/shared/ui/components/tooltip";

import { useCourseLessons } from "../hooks/use-course-lessons";
import {
  LessonSheet,
  type LessonSheetTarget,
  lessonSheetTargetToOpen,
} from "./lesson-sheet";
import { SortableLessonItem } from "./sortable-lesson-item";

interface CourseAdminContentTabProps {
  courseId: string;
  orgSlug: string;
}

type CourseLessonsController = ReturnType<typeof useCourseLessons>;

export const LessonCollectionPlaceholder = ({
  controller,
  onCreate,
  t,
}: {
  controller: CourseLessonsController;
  onCreate: () => void;
  t: CoursesTranslations;
}) => {
  if (controller.isLessonsLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="bg-ground h-20 w-full animate-pulse rounded-[16px]"
          />
        ))}
      </div>
    );
  }
  if (controller.lessons.length > 0) return null;
  return (
    <div className="border-hairline flex flex-col items-center justify-center rounded-[20px] border-2 border-dashed bg-white py-24 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-[14px] bg-blue-200 text-blue-700 shadow-[0_3px_0_0_var(--color-blue-400)]">
        <PlayCircle className="size-5" />
      </div>
      <h3 className="text-ink text-[16px] font-semibold">
        {t.detail.contentTab.noContent}
      </h3>
      <p className="text-ink-muted mt-1 mb-6 max-w-sm text-[14px]">
        {t.detail.contentTab.noContentSub}
      </p>
      <Button variant="outline" onClick={onCreate}>
        <Plus className="mr-2 h-4 w-4" />
        {t.detail.contentTab.addFirst}
      </Button>
    </div>
  );
};

export function LessonCollection({
  controller,
  courseId,
  onCreate,
  onEdit,
  orgSlug,
  t,
}: {
  controller: CourseLessonsController;
  courseId: string;
  onCreate: () => void;
  onEdit: (lessonId: string) => void;
  orgSlug: string;
  t: CoursesTranslations;
}) {
  if (controller.isLessonsLoading || controller.lessons.length === 0) {
    return (
      <LessonCollectionPlaceholder
        controller={controller}
        onCreate={onCreate}
        t={t}
      />
    );
  }
  return (
    <DndContext
      id="course-lessons-dnd"
      sensors={controller.sensors}
      collisionDetection={closestCenter}
      onDragStart={controller.handleDragStart}
      onDragEnd={controller.handleDragEnd}
    >
      <div className="flex flex-col gap-3">
        <SortableContext
          items={controller.lessons.map((lesson) => lesson.id)}
          strategy={verticalListSortingStrategy}
        >
          {controller.lessons.map((lesson) => (
            <SortableLessonItem
              key={lesson.id}
              id={lesson.id}
              lesson={lesson}
              courseId={courseId}
              orgSlug={orgSlug}
              onDelete={() =>
                controller.setLessonToDelete({
                  id: lesson.id,
                  title: lesson.title,
                })
              }
              onEdit={() => onEdit(lesson.id)}
            />
          ))}
        </SortableContext>
      </div>
      <DragOverlay
        dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: { active: { opacity: "0.4" } },
          }),
        }}
      >
        {controller.activeId ? (
          <SortableLessonItem
            id={controller.activeId}
            lesson={
              controller.lessons.find(
                (lesson) => lesson.id === controller.activeId,
              )!
            }
            courseId={courseId}
            orgSlug={orgSlug}
            isOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export function LessonDeleteDialog({
  controller,
  t,
}: {
  controller: CourseLessonsController;
  t: CoursesTranslations;
}) {
  const contentT = t.detail.contentTab;
  return (
    <Dialog
      open={Boolean(controller.lessonToDelete)}
      onOpenChange={(open) => !open && controller.setLessonToDelete(null)}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{contentT.deleteTitle}</DialogTitle>
          <DialogDescription>
            {contentT.deleteDesc.replace(
              "{{title}}",
              controller.lessonToDelete?.title ?? "",
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => controller.setLessonToDelete(null)}
          >
            {contentT.cancel}
          </Button>
          <Button
            variant="destructive"
            onClick={() =>
              controller.lessonToDelete &&
              controller.deleteLesson(controller.lessonToDelete.id)
            }
          >
            {contentT.deleteBtn}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CourseAdminContentTab({
  courseId,
  orgSlug,
}: CourseAdminContentTabProps) {
  const { translations: t } = useTranslation("courses");
  const [sheetTarget, setSheetTarget] = useState<LessonSheetTarget>({
    mode: "closed",
  });

  const controller = useCourseLessons({ courseId });
  const { data: course } = api.course.getById.useQuery({ courseId });

  const contentT = t.detail.contentTab;

  const addBlockedReason =
    course?.mode === "LESSON" && controller.lessons.length > 0
      ? contentT.addBlockedLessonMode
      : null;

  const sheetLesson = useMemo(() => {
    if (sheetTarget.mode !== "edit") return undefined;
    return controller.lessons.find(
      (lesson) => lesson.id === sheetTarget.lessonId,
    );
  }, [controller.lessons, sheetTarget]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-ink text-[18px] font-semibold">{contentT.title}</h3>
        <DisabledReasonTooltip reason={addBlockedReason} side="left">
          <Button
            onClick={() => setSheetTarget({ mode: "create" })}
            disabled={Boolean(addBlockedReason)}
          >
            <Plus className="mr-2 h-4 w-4" />
            {contentT.addBtn}
          </Button>
        </DisabledReasonTooltip>
      </div>

      <LessonSheet
        courseId={courseId}
        open={lessonSheetTargetToOpen(sheetTarget)}
        onOpenChange={(open) => {
          if (!open) setSheetTarget({ mode: "closed" });
        }}
        lesson={sheetTarget.mode === "edit" ? sheetLesson : undefined}
      />

      <div className="flex flex-col gap-4">
        <LessonCollection
          controller={controller}
          courseId={courseId}
          orgSlug={orgSlug}
          onCreate={() => setSheetTarget({ mode: "create" })}
          onEdit={(lessonId) => setSheetTarget({ mode: "edit", lessonId })}
          t={t}
        />
      </div>
      <LessonDeleteDialog controller={controller} t={t} />
    </div>
  );
}
