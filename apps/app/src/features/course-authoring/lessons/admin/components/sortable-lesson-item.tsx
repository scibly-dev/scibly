"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type LessonIcon } from "@scibly/db/enums";
import { routes } from "@scibly/routes";
import { Button } from "@scibly/ui/components/button";
import { cardClass, cardInteractiveClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import { Clock, Edit2, GripVertical, Trash2 } from "lucide-react";
import Link from "next/link";

import { type CoursesTranslations } from "@/features/course-authoring/contracts";
import { useTranslation } from "@/i18n/hooks/use-translation";
import { LessonIconGlyph } from "@/shared/content/course/components/lesson-icon-glyph";

interface SortableLessonItemProps {
  id: string;
  lesson: {
    id: string;
    title: string;
    description: string | null;
    icon?: LessonIcon | null;
    estimatedTimeToCompleteMinutes: number;
  };
  courseId: string;
  orgSlug: string;
  onDelete?: () => void;
  onEdit?: () => void;
  isOverlay?: boolean;
}

export function LessonItemActions({
  courseId,
  lesson,
  onDelete,
  onEdit,
  orgSlug,
  t,
}: Pick<
  SortableLessonItemProps,
  "courseId" | "lesson" | "onDelete" | "onEdit" | "orgSlug"
> & { t: CoursesTranslations }) {
  return (
    <div className="ml-4 flex shrink-0 items-center gap-2">
      {lesson.estimatedTimeToCompleteMinutes > 0 && (
        <span className="text-ink-soft mr-2 flex items-center gap-1.5 text-[13px] font-semibold whitespace-nowrap">
          <Clock className="h-3.5 w-3.5" />
          {lesson.estimatedTimeToCompleteMinutes}m
        </span>
      )}
      <div className="flex items-center gap-1 opacity-0 transition-all group-hover:opacity-100">
        <Link
          href={routes.app.profile
            .org(orgSlug)
            .courses.lesson(courseId, lesson.id)}
        >
          <Button variant="outline" size="sm" className="h-8 px-3 text-[12px]">
            {t.detail.contentTab.openBuilder}
          </Button>
        </Link>
        {onEdit ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="text-ink-faint h-8 w-8 hover:bg-blue-100 hover:text-blue-700"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        ) : null}
        {onDelete ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="text-ink-faint h-8 w-8 hover:bg-red-100 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function SortableLessonItem({
  id,
  lesson,
  courseId,
  orgSlug,
  onDelete,
  onEdit,
  isOverlay = false,
}: SortableLessonItemProps) {
  const { translations: t } = useTranslation("courses");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: isOverlay });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        cardClass,
        cardInteractiveClass,
        "group flex items-center justify-between rounded-[16px] p-4",
        isDragging &&
          "z-50 scale-[0.98] border-blue-400 opacity-40 shadow-none",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4 overflow-hidden">
        <button
          type="button"
          className="text-ink-faint shrink-0 cursor-grab touch-none opacity-50 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-blue-200 text-blue-700 shadow-[0_2px_0_0_var(--color-blue-400)]">
            <LessonIconGlyph icon={lesson.icon} className="size-[18px]" />
          </div>
          <div className="flex min-w-0 flex-col">
            <h4 className="text-ink group-hover:text-link truncate text-[15px] font-semibold transition-colors">
              {lesson.title}
            </h4>
            {lesson.description && (
              <p className="text-ink-muted line-clamp-1 max-w-xl text-[13px]">
                {lesson.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {!isOverlay ? (
        <LessonItemActions
          courseId={courseId}
          lesson={lesson}
          onDelete={onDelete}
          onEdit={onEdit}
          orgSlug={orgSlug}
          t={t}
        />
      ) : null}
    </div>
  );
}
