"use client";

import type { RouterOutputs } from "@/shared/api/trpc/client";

import { Button } from "@scibly/ui/components/button";
import { Input } from "@scibly/ui/components/input";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { useDebounce } from "use-debounce";

import { useTranslation } from "@/i18n/hooks/use-translation";
import { api } from "@/shared/api/trpc/client";
import { usePagination } from "@/shared/ui/hooks/use-pagination";

import { CourseCard } from "./course-card";
import { CourseCreateSheet } from "./course-create-sheet";
import { CoursePagination } from "./course-pagination";
import { CourseSkeletonGrid } from "./course-skeleton-grid";

export const ITEMS_PER_PAGE = 6;

interface CourseListProps {
  orgSlug: string;
  page?: number;
  search?: string;
}

type Course = RouterOutputs["course"]["list"]["items"][number];

export const CourseGrid = ({
  courses,
  isLoading,
  orgSlug,
  emptyTitle,
  emptyDescription,
}: {
  courses: Course[];
  isLoading: boolean;
  orgSlug: string;
  emptyTitle: string;
  emptyDescription: string;
}) => {
  if (isLoading) return <CourseSkeletonGrid />;
  if (courses.length > 0) {
    return (
      <div className="grid grid-cols-1 content-start gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} orgSlug={orgSlug} />
        ))}
      </div>
    );
  }
  return (
    <div className="border-hairline flex flex-1 flex-col items-center justify-center rounded-[20px] border-2 border-dashed bg-white/60 py-20 text-center">
      <Search className="text-ink-faint mb-4 h-10 w-10" />
      <h3 className="text-ink text-lg font-semibold">{emptyTitle}</h3>
      <p className="text-ink-soft mt-1">{emptyDescription}</p>
    </div>
  );
};

export function CourseList({ orgSlug }: CourseListProps) {
  const { translations: t } = useTranslation("courses");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 300);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { setPage, cursor, pageSize, getPaginationProps } = usePagination({
    pageSize: ITEMS_PER_PAGE,
  });

  const { data, isLoading } = api.course.list.useQuery({
    orgSlug,
    limit: pageSize,
    cursor,
    search: debouncedSearch || undefined,
  });

  const courses = data?.items ?? [];
  const paginationProps = getPaginationProps(
    data?.totalCount,
    !!data?.nextCursor,
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Controls Bar */}
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="relative w-full sm:w-[320px]">
          <Search className="text-ink-faint absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder={t.list.searchPlaceholder}
            value={searchQuery}
            onChange={handleSearch}
            className="h-10 pl-10"
          />
        </div>
        <Button
          className="w-full sm:w-auto"
          onClick={() => setIsSheetOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t.list.createButton}
        </Button>
      </div>

      {/* Grid Area */}
      <div className="flex min-h-[560px] flex-col">
        <CourseGrid
          courses={courses}
          isLoading={isLoading}
          orgSlug={orgSlug}
          emptyTitle={t.list.noCourses}
          emptyDescription={t.list.adjustQuery}
        />
      </div>

      <CoursePagination
        currentPage={paginationProps.page}
        setCurrentPage={paginationProps.setPage}
        totalPages={paginationProps.totalPages}
        totalCount={paginationProps.totalCount}
        itemsPerPage={paginationProps.pageSize}
      />

      <CourseCreateSheet
        orgSlug={orgSlug}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
    </div>
  );
}
