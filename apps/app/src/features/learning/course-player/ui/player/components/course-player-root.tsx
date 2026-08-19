"use client";

import useEventListener from "@scibly/lib/hooks/use-event-listener";
import { type ReactNode } from "react";

import { CoursePlayerLoading } from "../course-overview/overview-skeleton";
import { unlockPlayerAudio } from "../lesson-player/utils/player-sfx";
import { type CoursePlayerContextValue } from "../utils/player-types";
import { CoursePlayerContext } from "./course-player-context";
import { CourseUnavailableState } from "./course-unavailable-state";

const UNLOCK_ON_GESTURE: AddEventListenerOptions = {
  passive: true,
  capture: true,
};

interface CoursePlayerProps {
  value: CoursePlayerContextValue;

  loadingFallback?: ReactNode;
  children: ReactNode;
}

export function CoursePlayerRoot({
  value,
  loadingFallback,
  children,
}: CoursePlayerProps) {
  useEventListener(
    "touchstart",
    unlockPlayerAudio,
    undefined,
    UNLOCK_ON_GESTURE,
  );
  useEventListener(
    "pointerdown",
    unlockPlayerAudio,
    undefined,
    UNLOCK_ON_GESTURE,
  );

  if (value.isLoading) {
    return loadingFallback ?? <CoursePlayerLoading />;
  }

  if (!value.course) {
    return (
      <CourseUnavailableState
        reason={value.unavailableReason ?? "load-failed"}
        onRetry={value.retryCourse}
      />
    );
  }

  return (
    <CoursePlayerContext.Provider value={value}>
      <div className="flex h-full w-full flex-col gap-8 pb-20">{children}</div>
    </CoursePlayerContext.Provider>
  );
}
