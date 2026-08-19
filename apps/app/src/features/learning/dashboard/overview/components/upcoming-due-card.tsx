import { routes } from "@scibly/routes";
import { Calendar } from "lucide-react";
import Link from "next/link";

import { useTranslation } from "@/i18n/hooks/use-translation";

import { type Stats } from "../i18n/dashboard-overview.types";

interface UpcomingDueCardProps {
  item: Stats["upcomingDue"][number];
  orgSlug: string;
}

export function UpcomingDueCard({ item, orgSlug }: UpcomingDueCardProps) {
  const { translations } = useTranslation("learn");
  const t = translations.overview;

  const daysLeft = Math.ceil(
    // eslint-disable-next-line react-hooks/purity
    (new Date(item.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  const urgent = daysLeft <= 3;

  return (
    <Link
      href={routes.app.profile.org(orgSlug).learn.course(item.course.id)}
      className="group flex items-center gap-3 rounded-xl border border-neutral-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${urgent ? "bg-red-50 dark:bg-red-900/20" : "bg-amber-50 dark:bg-amber-900/20"}`}
      >
        <Calendar
          className={`h-5 w-5 ${urgent ? "text-red-500" : "text-amber-500"}`}
        />
      </div>
      <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
        <p className="text-foreground truncate text-[14px] font-semibold transition-colors group-hover:text-blue-500">
          {item.course.title}
        </p>
        <p
          className={`text-[12px] font-medium ${urgent ? "text-red-500" : "text-amber-600 dark:text-amber-400"}`}
        >
          {daysLeft === 1
            ? t.dueInDay
            : t.dueInDays.replace("{{days}}", String(daysLeft))}
        </p>
      </div>
    </Link>
  );
}
