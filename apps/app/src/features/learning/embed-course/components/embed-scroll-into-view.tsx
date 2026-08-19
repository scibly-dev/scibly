"use client";

import { useEffect, useRef } from "react";

import { useCoursePlayer } from "../../course-player/ui/player";
import { readHostRect } from "../host-rect-store";
import { postToHost } from "../protocol";
import { shouldRequestScrollIntoView } from "../viewport";

interface EmbedScrollIntoViewProps {
  hostOrigin: string | null;
}

// Triggers on a scene change, not a height change — content resizes for many
// reasons, and yanking a customer's page for any of them is hostile.
export function EmbedScrollIntoView({ hostOrigin }: EmbedScrollIntoViewProps) {
  const { viewState } = useCoursePlayer();
  const sceneKey = `${viewState.type}:${"lessonId" in viewState ? viewState.lessonId : ""}`;

  const judgedScene = useRef<string | null>(null);

  useEffect(() => {
    const movedScene =
      judgedScene.current !== null && judgedScene.current !== sceneKey;
    judgedScene.current = sceneKey;
    if (!movedScene) return;
    if (!shouldRequestScrollIntoView(readHostRect())) return;
    postToHost({ type: "scroll-into-view" }, hostOrigin);
  }, [sceneKey, hostOrigin]);

  return null;
}
