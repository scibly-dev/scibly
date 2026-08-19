import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";

import { type CoursesTranslations } from "@/features/course-authoring/contracts";
import {
  hasApplicationCode,
  readErrorShortfall,
} from "@/shared/api/trpc/application-code";
import { api } from "@/shared/api/trpc/client";

import { EnrollMembersDialogView } from "./course-enroll-members-dialog-view";

interface CourseEnrollMembersDialogProps {
  courseId: string;
  orgSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  t: CoursesTranslations;
}

export function CourseEnrollMembersDialog({
  courseId,
  orgSlug,
  open,
  onOpenChange,
  t,
}: CourseEnrollMembersDialogProps) {
  const utils = api.useUtils();
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 300);
  const [selectedIds, setSelectedIds] = useState(() => new Set<string>());
  const [dueDate, setDueDate] = useState("");
  const { ref, inView } = useInView();
  const query = api.course.getAvailableMembers.useInfiniteQuery(
    { courseId, search: debouncedSearch, limit: 10 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor, enabled: open },
  );
  useEffect(() => {
    if (inView && query.hasNextPage && !query.isFetchingNextPage)
      void query.fetchNextPage();
  }, [inView, query]);
  const { data: access } = api.billing.getFeatureAccess.useQuery(
    { orgSlug },
    { enabled: open },
  );
  const seatGate = access?.enroll.allowed === false ? access.enroll : null;
  const [seatShortfall, setSeatShortfall] = useState<number | null>(null);
  const enrollment = api.course.enrollMembers.useMutation({
    onSuccess: (result) => {
      toast.success(
        t.detail.enrollDialog.toastSuccess.replace(
          "{{count}}",
          String(result.count),
        ),
      );
      utils.course.listEnrollments.invalidate({ courseId });
      utils.course.getStats.invalidate({ courseId });
      utils.course.getAvailableMembers.invalidate({ courseId });
      onOpenChange(false);
      setSelectedIds(new Set());
      setSearch("");
      setDueDate("");
    },
    onError: (error) => {
      const shortfall = hasApplicationCode(error, "entitlement.seats_exhausted")
        ? readErrorShortfall(error)
        : null;
      setSeatShortfall(shortfall);
      if (shortfall === null) {
        toast.error(error.message || t.detail.enrollDialog.toastError);
      }
    },
  });
  const toggleUser = (userId: string) => {
    setSeatShortfall(null);
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };
  const handleEnroll = () => {
    if (selectedIds.size === 0) return;
    setSeatShortfall(null);
    enrollment.mutate({
      courseId,
      userIds: Array.from(selectedIds),
      dueDate: dueDate ? new Date(dueDate) : null,
    });
  };
  return (
    <EnrollMembersDialogView
      dueDate={dueDate}
      hasNextPage={Boolean(query.hasNextPage)}
      loading={query.isLoading}
      members={query.data?.pages.flatMap((page) => page.items) ?? []}
      onDueDateChange={setDueDate}
      onEnroll={handleEnroll}
      onOpenChange={onOpenChange}
      onSearchChange={setSearch}
      onToggle={toggleUser}
      open={open}
      orgSlug={orgSlug}
      pending={enrollment.isPending}
      search={search}
      seatGate={seatGate}
      seatShortfall={seatShortfall}
      selectedIds={selectedIds}
      sentinelRef={ref}
      t={t}
    />
  );
}
