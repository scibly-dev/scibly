"use client";

import { routes } from "@scibly/routes";
import { BookOpen, Calendar } from "lucide-react";
import Link from "next/link";

import { useTranslation } from "@/i18n/hooks/use-translation";
import { api } from "@/shared/api/trpc/client";

import { EmptyState } from "./empty-state";
import { RecentActivityCard } from "./recent-activity-card";
import { STAT_CONFIGS, StatCard } from "./stat-card";
import { UpcomingDueCard } from "./upcoming-due-card";

interface DashboardOverviewProps {
  orgSlug: string;
}

export default function DashboardOverview({ orgSlug }: DashboardOverviewProps) {
  const { data: stats } = api.learning.getDashboardStats.useQuery({ orgSlug });
  const { translations } = useTranslation("learn");
  const t = translations.overview;

  if (!stats) return null;

  const hasRecent = stats.recentActivity.length > 0;
  const hasDue = stats.upcomingDue.length > 0;
  return (
    <div className="flex flex-col gap-10">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STAT_CONFIGS.map((config) => (
          <StatCard key={config.key} config={config} stats={stats} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <section className="flex flex-col gap-4 rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between">
            <h2 className="text-foreground text-[15px] font-semibold">
              {t.recentActivity}
            </h2>
            <Link
              href={routes.app.profile.org(orgSlug).learn.courses}
              className="text-[13px] font-medium text-[hsl(var(--section-accent))] transition-opacity hover:opacity-80"
            >
              {t.viewAll}
            </Link>
          </div>
          {hasRecent ? (
            <div className="flex flex-col gap-2">
              {stats.recentActivity.map((item) => (
                <RecentActivityCard
                  key={item.enrollmentId}
                  item={item}
                  orgSlug={orgSlug}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={
                <BookOpen className="h-8 w-8 text-neutral-300 dark:text-neutral-600" />
              }
              message={t.noActivity}
            />
          )}
        </section>

        {/* Upcoming Deadlines */}
        <section className="flex flex-col gap-4 rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="text-foreground text-[15px] font-semibold">
            {t.upcomingDeadlines}
          </h2>
          {hasDue ? (
            <div className="flex flex-col gap-2">
              {stats.upcomingDue.map((item) => (
                <UpcomingDueCard
                  key={item.enrollmentId}
                  item={item}
                  orgSlug={orgSlug}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={
                <Calendar className="h-8 w-8 text-neutral-300 dark:text-neutral-600" />
              }
              message={t.noDeadlines}
            />
          )}
        </section>
      </div>
    </div>
  );
}
