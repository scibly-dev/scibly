"use client";

import { cn } from "@scibly/ui/utils";
import dynamic from "next/dynamic";
import { useState } from "react";

import { useTranslation } from "@/i18n/hooks/use-translation";

import { CourseAdminPeopleTab } from "../../../enrollments/components/course-admin-people-tab";
import { CourseAdminContentTab } from "../../../lessons/admin/components/course-admin-content-tab";
import { COURSE_ADMIN_TABS, type CourseAdminTabType } from "../constants";

// Recharts only ever renders under the Analytics tab, which isn't the one the
// page opens on — keep it out of the course page's initial JS.
const CourseAnalyticsDashboard = dynamic(() =>
  import("../../../analytics/components/course-analytics-dashboard").then(
    (m) => m.CourseAnalyticsDashboard,
  ),
);

export function CourseAdminTabs({
  courseId,
  orgSlug,
}: {
  courseId: string;
  orgSlug: string;
}) {
  const { translations: t } = useTranslation("courses");
  const [activeTab, setActiveTab] = useState<CourseAdminTabType>(
    COURSE_ADMIN_TABS.CONTENT,
  );

  const TAB_ITEMS = [
    { key: COURSE_ADMIN_TABS.CONTENT, label: t.detail.tabs.content },
    { key: COURSE_ADMIN_TABS.PEOPLE, label: t.detail.tabs.people },
    { key: COURSE_ADMIN_TABS.ANALYTICS, label: t.detail.tabs.analytics },
  ];

  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="border-edge bg-ground flex w-fit items-center gap-1 overflow-x-auto rounded-[14px] border-2 p-1">
        {TAB_ITEMS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "cursor-pointer rounded-[10px] px-5 py-2 text-[13px] font-semibold transition-colors",
              activeTab === tab.key
                ? "text-ink bg-white shadow-[0_2px_0_0_var(--color-lip)]"
                : "text-ink-soft hover:text-ink",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === COURSE_ADMIN_TABS.CONTENT && (
        <CourseAdminContentTab courseId={courseId} orgSlug={orgSlug} />
      )}

      {activeTab === COURSE_ADMIN_TABS.PEOPLE && (
        <CourseAdminPeopleTab courseId={courseId} orgSlug={orgSlug} />
      )}

      {activeTab === COURSE_ADMIN_TABS.ANALYTICS && (
        <CourseAnalyticsDashboard courseId={courseId} />
      )}
    </div>
  );
}
