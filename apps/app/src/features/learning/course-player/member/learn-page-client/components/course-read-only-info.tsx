"use client";

import { Info } from "lucide-react";

import { useTranslation } from "@/i18n/hooks/use-translation";

import { CourseUnavailablePanel } from "../../../ui/player/components/course-unavailable-panel";

interface CourseReadOnlyInfoProps {
  courseTitle: string;
  version?: number;
}

export function CourseReadOnlyInfo({
  courseTitle,
  version,
}: CourseReadOnlyInfoProps) {
  const { translations } = useTranslation("learn");
  const t = translations.playerStates.readOnly;

  const displayTitle =
    version !== undefined ? `${courseTitle} (v${version})` : courseTitle;
  const description = t.description.replace("{{courseTitle}}", displayTitle);

  return (
    <CourseUnavailablePanel
      icon={<Info className="h-7 w-7 text-sky-600 dark:text-sky-400" />}
      tileClassName="bg-sky-100 dark:bg-sky-900/30"
      title={t.title}
      description={description}
    />
  );
}
