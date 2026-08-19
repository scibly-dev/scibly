"use client";

import { useLocale } from "@scibly/i18n/react";
import { Button } from "@scibly/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@scibly/ui/components/dropdown-menu";
import { Filter, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";

import { type CoursesTranslations } from "@/features/course-authoring/contracts";
import { useTranslation } from "@/i18n/hooks/use-translation";
import { api } from "@/shared/api/trpc/client";
import { DataTable } from "@/shared/ui/components/data-table";
import { usePagination } from "@/shared/ui/hooks/use-pagination";

import { STATUS_FILTER, type StatusFilterType } from "../constants";
import { CourseEnrollMembersDialog } from "./course-enroll-members-dialog";
import { buildCourseEnrollmentColumns } from "./course-enrollment-columns";

function statusLabel(status: StatusFilterType, t: CoursesTranslations) {
  const peopleT = t.detail.peopleTab;
  if (status === STATUS_FILTER.NOT_STARTED) return peopleT.statusNotStarted;
  if (status === STATUS_FILTER.IN_PROGRESS) return peopleT.statusInProgress;
  if (status === STATUS_FILTER.COMPLETED) return peopleT.statusCompleted;
  return peopleT.statusAll;
}

export function CoursePeopleFilters({
  onAdd,
  onStatusChange,
  status,
  t,
}: {
  onAdd: () => void;
  onStatusChange: (status: StatusFilterType) => void;
  status: StatusFilterType;
  t: CoursesTranslations;
}) {
  const peopleT = t.detail.peopleTab;
  const options = [
    [STATUS_FILTER.ALL, peopleT.statusAll],
    [STATUS_FILTER.NOT_STARTED, peopleT.statusNotStarted],
    [STATUS_FILTER.IN_PROGRESS, peopleT.statusInProgress],
    [STATUS_FILTER.COMPLETED, peopleT.statusCompleted],
  ] as const;
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="h-9 w-[160px] justify-start text-left font-semibold"
          >
            <Filter className="text-ink-soft mr-2 h-4 w-4" />
            {statusLabel(status, t)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          {options.map(([value, label]) => (
            <DropdownMenuItem key={value} onClick={() => onStatusChange(value)}>
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button onClick={onAdd} className="px-6">
        {peopleT.addMembers}
      </Button>
    </>
  );
}

function PeopleEmptyState({
  onAdd,
  t,
}: {
  onAdd: () => void;
  t: CoursesTranslations;
}) {
  const peopleT = t.detail.peopleTab;
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <span className="border-hairline bg-ground-soft flex size-12 items-center justify-center rounded-2xl border-2">
        <Users className="text-ink-faint size-5" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-ink text-[14px] font-semibold">
          {peopleT.emptyTitle}
        </p>
        <p className="text-ink-soft text-[13px]">{peopleT.emptyDescription}</p>
      </div>
      <Button onClick={onAdd} className="mt-1 px-6">
        {peopleT.addMembers}
      </Button>
    </div>
  );
}

function useCoursePeople(courseId: string, t: CoursesTranslations) {
  const locale = useLocale();
  const [search, setSearchState] = useState("");
  const [debouncedSearch] = useDebounce(search, 300);
  const [statusFilter, setStatusFilterState] = useState<StatusFilterType>(
    STATUS_FILTER.ALL,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const paginationControl = usePagination({ pageSize: 10 });
  const utils = api.useUtils();
  const remove = api.course.removeEnrollment.useMutation({
    onSuccess: () => {
      toast.success(t.detail.peopleTab.toastRemoveSuccess);
      utils.course.listEnrollments.invalidate({ courseId });
      utils.course.getStats.invalidate({ courseId });
      utils.course.getAvailableMembers.invalidate({ courseId });
    },
    onError: (error) =>
      toast.error(error.message || t.detail.peopleTab.toastRemoveError),
  });
  const query = api.course.listEnrollments.useQuery({
    courseId,
    limit: paginationControl.pageSize,
    cursor: paginationControl.cursor,
    search: debouncedSearch,
    status: statusFilter,
  });
  const people = query.data?.items || [];
  const pagination = paginationControl.getPaginationProps(
    query.data?.totalCount,
    Boolean(query.data?.nextCursor),
  );
  const viewingText =
    pagination.totalCount <= 0
      ? ""
      : t.detail.peopleTab.showingUsers
          .replace(
            "{{start}}",
            String(pagination.cursor + Math.min(1, people.length)),
          )
          .replace("{{end}}", String(pagination.cursor + people.length))
          .replace("{{total}}", String(pagination.totalCount));
  const resetPage = (change: () => void) => {
    change();
    paginationControl.setPage(1);
  };
  return {
    columns: buildCourseEnrollmentColumns({
      courseId,
      locale,
      maxTries: query.data?.maxTries,
      t,
      onRemove: remove.mutate,
    }),
    dialogOpen,
    pagination,
    people,
    query,
    search,
    setDialogOpen,
    setSearch: (value: string) => resetPage(() => setSearchState(value)),
    setStatusFilter: (value: StatusFilterType) =>
      resetPage(() => setStatusFilterState(value)),
    statusFilter,
    viewingText,
  };
}

export function CourseAdminPeopleTab({
  courseId,
  orgSlug,
}: {
  courseId: string;
  orgSlug: string;
}) {
  const { translations: t } = useTranslation("courses");
  const controller = useCoursePeople(courseId, t);
  const peopleT = t.detail.peopleTab;
  return (
    <>
      <DataTable
        heightClass="h-[60vh] min-h-[400px]"
        search={controller.search}
        onSearchChange={controller.setSearch}
        searchPlaceholder={peopleT.searchPlaceholder}
        filters={
          <CoursePeopleFilters
            onAdd={() => controller.setDialogOpen(true)}
            onStatusChange={controller.setStatusFilter}
            status={controller.statusFilter}
            t={t}
          />
        }
        isLoading={controller.query.isLoading}
        isFetching={controller.query.isFetching}
        skeletonCount={10}
        pagination={{
          viewingText: controller.viewingText,
          onPrevious: controller.pagination.onPreviousPage,
          onNext: controller.pagination.onNextPage,
          hasPreviousPage: controller.pagination.hasPreviousPage,
          hasNextPage: controller.pagination.hasNextPage,
        }}
        data={controller.people}
        keyExtractor={(person) => person.userId ?? person.id}
        columns={controller.columns}
        emptyMessage={
          controller.search ? (
            peopleT.emptyMessage.replace("{{search}}", controller.search)
          ) : controller.statusFilter !== STATUS_FILTER.ALL ? (
            peopleT.emptyFiltered
          ) : (
            <PeopleEmptyState
              onAdd={() => controller.setDialogOpen(true)}
              t={t}
            />
          )
        }
      />
      <CourseEnrollMembersDialog
        courseId={courseId}
        orgSlug={orgSlug}
        open={controller.dialogOpen}
        onOpenChange={controller.setDialogOpen}
        t={t}
      />
    </>
  );
}
