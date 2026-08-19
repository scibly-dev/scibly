"use client";

import type { RouterOutputs } from "@/shared/api/trpc/client";
import type { NotebookTranslations } from "../i18n/notebook.types";

import { Button } from "@scibly/ui/components/button";
import { fieldClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  GraduationCap,
  Loader2,
  Plus,
  Search,
} from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";

import { api } from "@/shared/api/trpc/client";

import { notebookIconButton } from "../workspace/components/notebook-shell";
import { CoursePublishStatusBadge } from "./components/course-publish-status-badge";
import { useCoursePickerActions } from "./hooks/use-course-picker-actions";

interface CoursePickerViewProps {
  onClose: () => void;
  orgSlug: string;
  notebookId: string | undefined;
  t: NotebookTranslations;
}

type Course = RouterOutputs["course"]["list"]["items"][number];
type Labels = NotebookTranslations["studio"]["courseBuilder"];

const EMPTY_COURSES: Course[] = [];

export const CoursePickerHeader = ({
  close,
  labels,
}: {
  close: () => void;
  labels: Labels;
}) => {
  return (
    <div className="border-hairline flex items-center gap-3 border-b-2 px-4 py-4 dark:border-neutral-800">
      <button
        type="button"
        onClick={close}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-[10px]",
          notebookIconButton,
        )}
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#eff5ff] text-[#0b52cc] dark:bg-blue-950/30 dark:text-blue-400">
          <BookOpen className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-ink text-sm font-semibold dark:text-neutral-100">
            {labels.title}
          </h3>
          <p className="text-ink-soft text-xs dark:text-neutral-400">
            {labels.subtitle}
          </p>
        </div>
      </div>
    </div>
  );
};

export const CourseResults = ({
  courses,
  loading,
  labels,
  open,
}: {
  courses: Course[];
  loading: boolean;
  labels: Labels;
  open: (course: Course) => void;
}) => {
  if (loading)
    return (
      <div className="text-ink-faint flex items-center justify-center gap-2 py-8 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        {labels.loading}
      </div>
    );
  if (courses.length === 0)
    return (
      <div className="text-ink-faint flex flex-col items-center justify-center gap-2 py-8 text-sm">
        <GraduationCap className="h-8 w-8 opacity-30" />
        {labels.noResults}
      </div>
    );
  return (
    <ul className="divide-hairline divide-y-2 dark:divide-neutral-800/60">
      {courses.map((course) => (
        <li key={course.id}>
          <button
            type="button"
            onClick={() => open(course)}
            className="group hover:bg-ground-soft flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors dark:hover:bg-neutral-900/50"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="bg-ground text-ink-soft flex h-7 w-7 shrink-0 items-center justify-center rounded-md dark:bg-neutral-800 dark:text-neutral-400">
                <GraduationCap className="h-4 w-4" />
              </div>
              <span className="text-ink truncate text-sm font-medium dark:text-neutral-200">
                {course.title}
              </span>
              <CoursePublishStatusBadge
                latestPublishedVersion={course.latestPublishedVersion}
                draftVersion={(course.latestPublishedVersion?.version ?? 0) + 1}
                t={labels}
                className="shrink-0"
              />
            </div>
            <ChevronRight className="text-ink-faint group-hover:text-ink-muted h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 dark:text-neutral-600" />
          </button>
        </li>
      ))}
    </ul>
  );
};

export const CreateCourseSection = ({
  creating,
  setCreating,
  title,
  setTitle,
  create,
  pending,
  labels,
}: {
  creating: boolean;
  setCreating: (value: boolean) => void;
  title: string;
  setTitle: (value: string) => void;
  create: () => void;
  pending: boolean;
  labels: Labels;
}) => {
  return (
    <div className="border-hairline border-t-2 p-4 dark:border-neutral-800">
      {creating ? (
        <div className="flex flex-col gap-2">
          <input
            id="course-picker-new-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") create();
            }}
            placeholder={labels.courseTitlePlaceholder}
            className={cn(
              "w-full rounded-xl px-3 py-1.5 text-sm",
              fieldClass,
              "dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:shadow-none",
            )}
            autoFocus
          />
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setCreating(false);
                setTitle("");
              }}
            >
              {labels.cancel}
            </Button>
            <Button
              size="sm"
              onClick={create}
              disabled={pending || !title.trim()}
            >
              {pending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                labels.createNew
              )}
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          id="course-picker-create-btn"
          onClick={() => setCreating(true)}
          className={cn(
            "border-edge text-ink-muted flex w-full items-center gap-2.5 rounded-xl border-2 border-dashed px-3 py-2.5 text-sm font-semibold",
            "transition-colors hover:border-[#b9d7ff] hover:bg-[#eff5ff] hover:text-[#0b52cc]",
            "dark:border-neutral-700 dark:hover:border-blue-700 dark:hover:bg-blue-950/20 dark:hover:text-blue-400",
          )}
        >
          <Plus className="h-4 w-4" />
          {labels.createNew}
        </button>
      )}
    </div>
  );
};

export function CoursePickerView({
  onClose,
  orgSlug,
  notebookId,
  t,
}: CoursePickerViewProps) {
  const cb = t.studio.courseBuilder;
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const { data, isLoading } = api.course.list.useQuery({ orgSlug, limit: 50 });
  const actions = useCoursePickerActions({
    notebookId,
    orgSlug,
    title: newTitle,
    labels: cb,
    close: onClose,
    resetCreate: () => {
      setCreating(false);
      setNewTitle("");
    },
  });

  const courses = data?.items ?? EMPTY_COURSES;

  const filtered = useMemo(() => {
    if (!deferredQuery) return courses;
    const lower = deferredQuery.toLowerCase();
    return courses.filter((c) => c.title.toLowerCase().includes(lower));
  }, [courses, deferredQuery]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-white dark:bg-neutral-950">
      <CoursePickerHeader close={onClose} labels={cb} />

      <div className="border-hairline flex items-center gap-2 border-b-2 px-4 py-2.5 dark:border-neutral-800">
        <Search className="text-ink-faint h-4 w-4 shrink-0" />
        <input
          id="course-picker-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={cb.searchPlaceholder}
          className="text-ink placeholder:text-ink-faint w-full bg-transparent text-sm focus:outline-none dark:text-neutral-200"
          autoFocus
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        <CourseResults
          courses={filtered}
          loading={isLoading}
          labels={cb}
          open={actions.open}
        />
      </div>

      <CreateCourseSection
        creating={creating}
        setCreating={setCreating}
        title={newTitle}
        setTitle={setNewTitle}
        create={actions.create}
        pending={actions.isCreating}
        labels={cb}
      />
    </div>
  );
}
