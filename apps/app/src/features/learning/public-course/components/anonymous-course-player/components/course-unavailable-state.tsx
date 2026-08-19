"use client";

import { CalendarClock } from "lucide-react";

import { useTranslation } from "@/i18n/hooks/use-translation";

import { CourseUnavailablePanel } from "../../../../course-player/ui/player/components/course-unavailable-panel";

export function CourseUnavailableState() {
  const { translations } = useTranslation("publicCourse");
  const t = translations.unavailable;

  return (
    <CourseUnavailablePanel
      icon={
        <CalendarClock className="h-7 w-7 text-neutral-500 dark:text-neutral-400" />
      }
      tileClassName="bg-neutral-100 dark:bg-neutral-800"
      title={t.title}
      description={t.description}
    />
  );
}
