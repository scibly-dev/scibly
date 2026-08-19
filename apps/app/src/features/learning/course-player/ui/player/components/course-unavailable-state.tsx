"use client";

import { Button } from "@scibly/ui/components/button";
import { CloudOff, FileClock, Unplug } from "lucide-react";

import { useTranslation } from "@/i18n/hooks/use-translation";

import { type CourseUnavailableReason } from "../hooks/use-player-navigation/course-availability";
import { CourseUnavailablePanel } from "./course-unavailable-panel";

interface CourseUnavailableStateProps {
  reason: CourseUnavailableReason;
  onRetry?: () => void;
}

export function CourseUnavailableState({
  reason,
  onRetry,
}: CourseUnavailableStateProps) {
  const { translations } = useTranslation("learn");
  const t = translations.playerStates.courseUnavailable;

  const { Icon, title, description } = {
    "not-published": {
      Icon: FileClock,
      title: t.notPublishedTitle,
      description: t.notPublishedDescription,
    },
    "not-available": {
      Icon: Unplug,
      title: t.notAvailableTitle,
      description: t.notAvailableDescription,
    },
    "load-failed": {
      Icon: CloudOff,
      title: t.loadFailedTitle,
      description: t.loadFailedDescription,
    },
  }[reason];

  return (
    <CourseUnavailablePanel
      icon={<Icon className="h-7 w-7 text-neutral-500 dark:text-neutral-400" />}
      tileClassName="bg-neutral-100 dark:bg-neutral-800"
      title={title}
      description={description}
    >
      {reason === "load-failed" && onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t.retry}
        </Button>
      )}
    </CourseUnavailablePanel>
  );
}
