"use client";

import type { NotebookTranslations } from "../../i18n/notebook.types";
import type {
  LessonNavigatorActions,
  LessonNavigatorItem,
} from "./lesson-navigator-view";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@scibly/ui/components/dropdown-menu";
import Icon from "@scibly/ui/components/icon";
import { cn } from "@scibly/ui/utils";
import { Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { ConfirmDeleteDialog } from "@/shared/ui/confirm-delete-dialog";
import { useInlineEdit } from "@/shared/ui/hooks/use-inline-edit";

import { notebookIconButton } from "../../workspace/components/notebook-shell";

type Labels = NotebookTranslations["studio"]["courseBuilder"];

export const LessonMenu = ({
  labels,
  beginRename,
  beginTime,
  remove,
}: {
  labels: Labels;
  beginRename: () => void;
  beginTime: () => void;
  remove: () => void;
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "mb-1 flex h-6 w-6 items-center justify-center rounded-md opacity-0 transition-all group-hover:opacity-100",
            notebookIconButton,
          )}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuItem onClick={beginRename}>
          <Pencil className="mr-2 h-3.5 w-3.5" />
          {labels.renameLesson}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={beginTime}>
          <Icon name="Clock" className="mr-2 h-3.5 w-3.5" />
          {labels.estimatedTime}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={remove}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="mr-2 h-3.5 w-3.5" />
          {labels.deleteLesson}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const LessonTabContent = ({
  lesson,
  active,
  editingField,
  renameEdit,
  timeEdit,
  select,
}: {
  lesson: LessonNavigatorItem;
  active: boolean;
  editingField: "rename" | "time" | null;
  renameEdit: ReturnType<typeof useInlineEdit<string>>;
  timeEdit: ReturnType<typeof useInlineEdit<number>>;
  select: () => void;
}) => {
  return (
    <div
      id={`lesson-tab-${lesson.id}`}
      onClick={select}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          select();
        }
      }}
      role="button"
      tabIndex={0}
      className={cn(
        "flex shrink-0 cursor-pointer items-center gap-1.5 border-b-[3px] px-1 pt-1 pb-2 text-sm transition-colors outline-none focus-visible:ring-4 focus-visible:ring-[#0066FF]/25",
        active
          ? "text-ink border-[#0066ff] font-bold dark:border-neutral-100 dark:text-neutral-100"
          : "text-ink-faint hover:text-ink-muted hover:border-edge border-transparent font-semibold dark:text-neutral-500 dark:hover:border-neutral-700 dark:hover:text-neutral-300",
      )}
    >
      {editingField === "rename" ? (
        <input
          autoFocus
          value={renameEdit.value}
          onChange={(event) => renameEdit.setValue(event.target.value)}
          onBlur={renameEdit.save}
          onKeyDown={renameEdit.onKeyDown}
          className="border-edge text-ink max-w-[200px] min-w-[150px] rounded-[10px] border-2 bg-white px-1.5 text-sm font-semibold focus:border-[#b9d7ff] focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
        />
      ) : (
        <span className="max-w-[200px] truncate">{lesson.title}</span>
      )}
      {lesson.estimatedTimeToCompleteMinutes > 0 || editingField === "time" ? (
        <span className="text-ink-faint ml-1 flex items-center gap-1 text-[11px]">
          <Icon name="Clock" className="h-3 w-3" />
          {editingField === "time" ? (
            <input
              autoFocus
              type="number"
              min="0"
              value={timeEdit.value}
              onChange={(event) =>
                timeEdit.setValue(Number(event.target.value))
              }
              onBlur={timeEdit.save}
              onKeyDown={timeEdit.onKeyDown}
              className="border-edge text-ink w-10 rounded-[10px] border-2 bg-white px-1 text-center text-[11px] focus:border-[#b9d7ff] focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
            />
          ) : (
            lesson.estimatedTimeToCompleteMinutes
          )}
        </span>
      ) : null}
    </div>
  );
};

function useLessonEdits(actions?: LessonNavigatorActions) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<"rename" | "time" | null>(
    null,
  );
  const finish = () => {
    setEditingId(null);
    setEditingField(null);
  };
  const renameEdit = useInlineEdit<string>({
    onSave: (value) => {
      if (editingId && value.trim())
        actions?.updateTitle(editingId, value.trim());
      finish();
    },
  });
  const timeEdit = useInlineEdit<number>({
    onSave: (minutes) => {
      if (editingId) actions?.updateTime(editingId, minutes);
      finish();
    },
  });
  const beginRename = (lesson: LessonNavigatorItem) => {
    setEditingId(lesson.id);
    setEditingField("rename");
    renameEdit.start(lesson.title);
  };
  const beginTime = (lesson: LessonNavigatorItem) => {
    setEditingId(lesson.id);
    setEditingField("time");
    timeEdit.start(lesson.estimatedTimeToCompleteMinutes);
  };
  return {
    editingId,
    editingField,
    renameEdit,
    timeEdit,
    beginRename,
    beginTime,
  };
}

export const LessonDeleteDialog = ({
  deleteId,
  setDeleteId,
  actions,
  labels,
}: {
  deleteId: string | null;
  setDeleteId: (id: string | null) => void;
  actions?: LessonNavigatorActions;
  labels: Labels;
}) => {
  if (!actions) return null;
  return (
    <ConfirmDeleteDialog
      open={Boolean(deleteId)}
      title={labels.deleteLessonConfirmTitle}
      description={labels.deleteLessonConfirmDescription}
      cancelLabel={labels.cancel}
      confirmLabel={labels.confirmDelete}
      isConfirming={actions.isDeleting}
      onCancel={() => setDeleteId(null)}
      onConfirm={() => {
        if (deleteId)
          void actions.delete(deleteId).then(
            (deleted) => {
              if (deleted) setDeleteId(null);
            },
            () => undefined,
          );
      }}
    />
  );
};

export function LessonNavigatorList({
  lessons,
  activeLessonId,
  actions,
  labels,
  select,
}: {
  lessons: readonly LessonNavigatorItem[];
  activeLessonId?: string;
  actions?: LessonNavigatorActions;
  labels: Labels;
  select: (lesson: LessonNavigatorItem) => void;
}) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const edits = useLessonEdits(actions);
  return (
    <>
      <div className="px-6 pb-4">
        <div className="no-scrollbar flex items-center gap-6 overflow-x-auto">
          {lessons.map((lesson) => (
            <div
              key={lesson.id}
              className="group flex shrink-0 items-center gap-1"
            >
              <LessonTabContent
                lesson={lesson}
                active={activeLessonId === lesson.id}
                editingField={
                  edits.editingId === lesson.id ? edits.editingField : null
                }
                renameEdit={edits.renameEdit}
                timeEdit={edits.timeEdit}
                select={() => select(lesson)}
              />
              {actions ? (
                <LessonMenu
                  labels={labels}
                  beginRename={() => edits.beginRename(lesson)}
                  beginTime={() => edits.beginTime(lesson)}
                  remove={() => setDeleteId(lesson.id)}
                />
              ) : null}
            </div>
          ))}
          {actions ? (
            <button
              type="button"
              id="course-builder-add-lesson"
              disabled={actions.isCreating}
              onClick={() => actions.create("New Lesson")}
              className={cn(
                "mb-1 flex h-6 w-6 items-center justify-center rounded-md disabled:opacity-40",
                notebookIconButton,
              )}
              title={labels.addLesson}
            >
              {actions.isCreating ? (
                <div className="animate-spin">
                  <Loader2 className="h-4 w-4" />
                </div>
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </button>
          ) : null}
        </div>
      </div>
      <LessonDeleteDialog
        deleteId={deleteId}
        setDeleteId={setDeleteId}
        actions={actions}
        labels={labels}
      />
    </>
  );
}
