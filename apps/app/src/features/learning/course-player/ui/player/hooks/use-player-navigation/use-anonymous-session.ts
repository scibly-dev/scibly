"use client";

import type { RefetchProgress } from "./types";

import { type AnonymousSessionSource } from "@scibly/db/enums";
import { useEffect, useRef } from "react";

import { api } from "@/shared/api/trpc/client";

export function useAnonymousSession({
  courseId,
  anonymousId,
  enabled,
  courseReady,
  refetchProgress,
  source,
  embedOrigin,
}: {
  courseId: string;
  anonymousId?: string;
  enabled: boolean;
  courseReady: boolean;
  refetchProgress: RefetchProgress;
  source?: AnonymousSessionSource;
  embedOrigin?: string | null;
}) {
  const startSessionMutation =
    api.sceneProgress.startAnonymousSession.useMutation();
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !courseReady || !anonymousId || hasStartedRef.current)
      return;
    hasStartedRef.current = true;
    startSessionMutation.mutate(
      {
        courseId,
        anonymousId,
        reset: false,
        source,
        embedOrigin,
      },
      { onSuccess: () => void refetchProgress() },
    );
  }, [
    enabled,
    courseReady,
    courseId,
    anonymousId,
    source,
    embedOrigin,
    startSessionMutation,
    refetchProgress,
  ]);

  return startSessionMutation;
}
