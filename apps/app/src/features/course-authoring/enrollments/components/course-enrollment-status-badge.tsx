import { EnrollmentStatus } from "@scibly/db/enums";
import { cn } from "@scibly/ui/utils";

import { type CoursesTranslations } from "@/features/course-authoring/contracts";

interface CourseEnrollmentStatusBadgeProps {
  status: EnrollmentStatus;
  hasCertificate?: boolean;
  className?: string;
  t: CoursesTranslations;
}

const BASE_CLASS =
  "inline-flex items-center rounded-lg border-2 px-2.5 py-0.5 text-[12px] font-semibold";

export function CourseEnrollmentStatusBadge({
  status,
  hasCertificate,
  className,
  t,
}: CourseEnrollmentStatusBadgeProps) {
  const badgeT = t.detail.statusBadge;

  const effectiveStatus =
    status === EnrollmentStatus.COMPLETED && hasCertificate === false
      ? "NOT_PASSED"
      : status;

  const tone = {
    NOT_PASSED: {
      label: badgeT.notPassed,
      className: "border-amber-300 bg-amber-100 text-amber-800",
    },
    [EnrollmentStatus.NOT_STARTED]: {
      label: badgeT.notStarted,
      className: "border-edge bg-ground text-ink-muted",
    },
    [EnrollmentStatus.IN_PROGRESS]: {
      label: badgeT.inProgress,
      className: "border-blue-300 bg-blue-100 text-blue-800",
    },
    [EnrollmentStatus.COMPLETED]: {
      label: badgeT.completed,
      className: "border-green-300 bg-green-100 text-green-800",
    },
  } satisfies Record<
    EnrollmentStatus | "NOT_PASSED",
    { label: string; className: string }
  >;

  const matched = tone[effectiveStatus];

  return (
    <span className={cn(BASE_CLASS, matched.className, className)}>
      {matched.label}
    </span>
  );
}
