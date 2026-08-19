import type { DictionaryPages } from "@/i18n/types";
import type { RouterOutputs } from "@/shared/api/trpc/contracts";

import { Button } from "@scibly/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@scibly/ui/components/dropdown-menu";
import { cn } from "@scibly/ui/utils";
import { MoreHorizontal } from "lucide-react";

import { CourseEnrollmentStatusBadge } from "./course-enrollment-status-badge";
import { CourseEnrollmentUserAvatar } from "./course-enrollment-user-avatar";

type CourseEnrollmentRow =
  RouterOutputs["course"]["listEnrollments"]["items"][number];

export function EnrollmentUserCell({
  person,
}: {
  person: CourseEnrollmentRow;
}) {
  return (
    <div className="flex items-center gap-3">
      <CourseEnrollmentUserAvatar
        name={person.name}
        email={person.email}
        image={person.image}
      />
      <div className="flex flex-col">
        <span className="text-ink leading-tight font-semibold">
          {person.name || person.email}
        </span>
        {person.name ? (
          <span className="text-ink-soft text-[12px] leading-tight">
            {person.email}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function EnrollmentTriesCell({
  maxTries,
  person,
}: {
  maxTries: number | null | undefined;
  person: CourseEnrollmentRow;
}) {
  if (maxTries === null || maxTries === undefined) {
    return <span>{person.triesUsed > 0 ? person.triesUsed : "—"}</span>;
  }
  return (
    <span
      className={
        person.triesUsed >= maxTries ? "font-semibold text-[#e5484d]" : ""
      }
    >
      {person.triesUsed} / {maxTries}
    </span>
  );
}

export function EnrollmentProgressCell({
  person,
}: {
  person: CourseEnrollmentRow;
}) {
  return (
    <div className="flex max-w-[140px] items-center gap-3">
      <div className="border-edge bg-ground h-2 w-full overflow-hidden rounded-full border">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            person.progress === 100 ? "bg-green-500" : "bg-[#0066FF]",
          )}
          style={{ width: `${person.progress}%` }}
        />
      </div>
      <span className="text-ink-soft min-w-[36px] text-[13px] font-semibold">
        {person.progress}%
      </span>
    </div>
  );
}

export function EnrollmentActionsCell({
  courseId,
  onRemove,
  person,
  removeLabel,
}: {
  courseId: string;
  onRemove: (input: { courseId: string; userId: string }) => void;
  person: CourseEnrollmentRow;
  removeLabel: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-ink-soft hover:text-ink h-8 w-8"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          className="cursor-pointer text-[#e5484d] focus:text-[#e5484d]"
          onClick={() =>
            person.userId && onRemove({ courseId, userId: person.userId })
          }
        >
          {removeLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function formatLastActive(
  person: CourseEnrollmentRow,
  locale: string,
  neverActive: string,
) {
  return person.lastActive
    ? new Date(person.lastActive).toLocaleDateString(locale)
    : neverActive;
}

export function buildCourseEnrollmentColumns({
  courseId,
  locale,
  maxTries,
  t,
  onRemove,
}: {
  courseId: string;
  locale: string;
  maxTries: number | null | undefined;
  t: DictionaryPages["courses"];
  onRemove: (input: { courseId: string; userId: string }) => void;
}) {
  const peopleT = t.detail.peopleTab;
  return [
    {
      header: peopleT.colUser,
      headerClassName: "w-[35%]",
      cellClassName: "w-[35%]",
      cell: (person: CourseEnrollmentRow) => (
        <EnrollmentUserCell person={person} />
      ),
    },
    {
      header: peopleT.colStatus,
      headerClassName: "w-[15%]",
      cellClassName: "w-[15%]",
      cell: (person: CourseEnrollmentRow) => (
        <CourseEnrollmentStatusBadge
          status={person.status}
          hasCertificate={person.hasCertificate}
          t={t}
        />
      ),
    },
    {
      header: peopleT.colVersion,
      headerClassName: "w-[8%]",
      cellClassName: "w-[8%] text-[13px] text-ink-soft",
      cell: (person: CourseEnrollmentRow) => `v${person.version}`,
    },
    {
      header: peopleT.colTries,
      headerClassName: "w-[10%]",
      cellClassName: "w-[10%] text-[13px] text-ink-soft",
      cell: (person: CourseEnrollmentRow) => (
        <EnrollmentTriesCell maxTries={maxTries} person={person} />
      ),
    },
    {
      header: peopleT.colProgress,
      headerClassName: "w-[20%]",
      cellClassName: "w-[20%]",
      cell: (person: CourseEnrollmentRow) => (
        <EnrollmentProgressCell person={person} />
      ),
    },
    {
      header: peopleT.colLastActive,
      headerClassName: "w-[12%] text-right",
      cellClassName: "w-[12%] text-right text-[13px] text-ink-soft",
      cell: (person: CourseEnrollmentRow) =>
        formatLastActive(person, locale, peopleT.neverActive),
    },
    {
      header: "",
      headerClassName: "w-[5%]",
      cellClassName: "text-right",
      cell: (person: CourseEnrollmentRow) => (
        <EnrollmentActionsCell
          courseId={courseId}
          onRemove={onRemove}
          person={person}
          removeLabel={peopleT.removeBtn}
        />
      ),
    },
  ];
}
