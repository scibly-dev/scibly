"use client";

import type { NotebookTranslations } from "../../i18n/notebook.types";

import { Button } from "@scibly/ui/components/button";
import { Loader2, Plus } from "lucide-react";

import { useEnsureValidSelection } from "../hooks/use-ensure-valid-selection";
import { LessonNavigatorList } from "./lesson-navigator-list";

export type LessonNavigatorItem = {
  id: string;
  title: string;
  estimatedTimeToCompleteMinutes: number;
};

export type LessonNavigatorActions = {
  create: (title: string) => void;
  delete: (lessonId: string) => Promise<boolean>;
  updateTitle: (lessonId: string, title: string) => void;
  updateTime: (lessonId: string, minutes: number) => void;
  isCreating: boolean;
  isDeleting: boolean;
};

type LessonNavigatorViewProps = {
  t: NotebookTranslations;
  lessons: readonly LessonNavigatorItem[];
  activeLessonId?: string;
  isLoading: boolean;
  onSelectLesson: (lesson: { id: string; title: string } | undefined) => void;

  onRepairSelection?: (
    lesson: { id: string; title: string } | undefined,
  ) => void;
} & (
  | { mode: "readonly"; actions?: never }
  | { mode: "editable"; actions: LessonNavigatorActions }
);

export function LessonNavigatorView(props: LessonNavigatorViewProps) {
  const { t, lessons, activeLessonId, isLoading, onSelectLesson } = props;
  const repairSelection = props.onRepairSelection ?? onSelectLesson;
  const actions = props.mode === "editable" ? props.actions : undefined;
  const cb = t.studio.courseBuilder;
  useEnsureValidSelection({
    items: lessons,
    activeId: activeLessonId,
    enabled: !isLoading,
    setActive: (lesson) =>
      repairSelection(
        lesson ? { id: lesson.id, title: lesson.title } : undefined,
      ),
  });

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="animate-spin">
          <Loader2 className="text-ink-faint h-6 w-6" />
        </div>
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-ink-faint text-sm dark:text-neutral-500">
          No lessons yet. Add your first lesson above.
        </p>
        {actions ? (
          <Button
            size="sm"
            disabled={actions.isCreating}
            onClick={() => actions.create("Lesson 1")}
          >
            {actions.isCreating ? (
              <div className="mr-1.5 animate-spin">
                <Loader2 className="h-3.5 w-3.5" />
              </div>
            ) : (
              <Plus className="mr-1.5 h-3.5 w-3.5" />
            )}
            {cb.addLesson}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <LessonNavigatorList
      lessons={lessons}
      activeLessonId={activeLessonId}
      actions={actions}
      labels={cb}
      select={(lesson) =>
        onSelectLesson({ id: lesson.id, title: lesson.title })
      }
    />
  );
}
