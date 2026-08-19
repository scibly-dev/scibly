import { routes } from "@scibly/routes";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

import { useTranslation } from "@/i18n/hooks/use-translation";

import { type Stats } from "../i18n/dashboard-overview.types";

type ActivityStatus = Stats["recentActivity"][number]["status"] | "NOT_PASSED";

const STATUS_COLOR = {
  COMPLETED:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  NOT_PASSED:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  IN_PROGRESS:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  NOT_STARTED:
    "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
} satisfies Record<ActivityStatus, string>;

interface RecentActivityCardProps {
  item: Stats["recentActivity"][number];
  orgSlug: string;
}

export function RecentActivityCard({ item, orgSlug }: RecentActivityCardProps) {
  const params = useParams<{ lang: string }>();
  const locale = params.lang || "en";
  const { translations } = useTranslation("learn");
  const t = translations.overview;
  const tCourses = translations.courses;

  const STATUS_LABEL = {
    COMPLETED: tCourses.status.completed,
    NOT_PASSED: tCourses.status.notPassed,
    IN_PROGRESS: tCourses.status.inProgress,
    NOT_STARTED: tCourses.status.notStarted,
  } satisfies Record<ActivityStatus, string>;

  const effectiveStatus: ActivityStatus =
    item.status === "COMPLETED" && !item.hasCertificate
      ? "NOT_PASSED"
      : item.status;
  const statusLabel = STATUS_LABEL[effectiveStatus];
  const statusColor = STATUS_COLOR[effectiveStatus];

  return (
    <Link
      href={routes.app.profile.org(orgSlug).learn.course(item.course.id)}
      className="group flex items-center gap-4 rounded-xl border border-neutral-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40">
        {item.course.thumbnail && (
          <Image
            src={item.course.thumbnail}
            alt={item.course.title}
            fill
            className="object-cover"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 overflow-hidden">
        <p className="text-foreground truncate text-[14px] font-semibold transition-colors group-hover:text-blue-500">
          {item.course.title}
        </p>
        {item.lastActive && (
          <p className="text-muted-foreground text-[12px]">
            {t.active}{" "}
            {new Date(item.lastActive).toLocaleDateString(locale, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        )}
      </div>
      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusColor}`}
      >
        {statusLabel}
      </span>
    </Link>
  );
}
