"use client";

import { Lock } from "lucide-react";

import { useTranslation } from "@/i18n/hooks/use-translation";

import { CourseUnavailablePanel } from "./course-unavailable-panel";

interface CourseLockedStateProps {
  courseTitle: string;
  maxTries: number;
}

export function CourseLockedState({
  courseTitle,
  maxTries,
}: CourseLockedStateProps) {
  const { translations } = useTranslation("learn");
  const t = translations.playerStates.locked;

  const timeWord = maxTries === 1 ? t.time : t.times;
  const description = t.description
    .replace("{{courseTitle}}", courseTitle)
    .replace("{{maxTries}}", String(maxTries))
    .replace("{{times}}", timeWord);

  return (
    <CourseUnavailablePanel
      icon={<Lock className="h-7 w-7 text-neutral-500 dark:text-neutral-400" />}
      tileClassName="bg-neutral-100 dark:bg-neutral-800"
      title={t.title}
      description={description}
    />
  );
}
