"use client";

import { useCallback, useRef, useState } from "react";

import { DEFAULT_REGION_RADIUS } from "@/features/notebook/media/tools/image-schemas";

import {
  CLICK_RADIUS_THRESHOLD,
  MAX_REGION_RADIUS,
  MIN_REGION_RADIUS,
} from "./infographic-region-geometry";

interface DraftRegion {
  x: number;
  y: number;
  radius: number;
}

interface UseCommentDragParams {
  commentMode: boolean;
  frameRef: React.RefObject<HTMLDivElement | null>;
  onAddComment: (x: number, y: number, radius: number) => void;
}

function pointFromEvent(
  event: React.PointerEvent,
  frame: HTMLDivElement | null,
) {
  if (!frame) return null;
  const rect = frame.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * 100,
    y: ((event.clientY - rect.top) / rect.height) * 100,
    rect,
  };
}

function radiusFromEvent(
  event: React.PointerEvent,
  center: { x: number; y: number },
  rect: DOMRect,
) {
  const dx = event.clientX - rect.left - (center.x / 100) * rect.width;
  const dy = event.clientY - rect.top - (center.y / 100) * rect.height;
  const shortEdge = Math.min(rect.width, rect.height);
  return shortEdge <= 0 ? 0 : (Math.hypot(dx, dy) / shortEdge) * 100;
}

export function useCommentDrag({
  commentMode,
  frameRef,
  onAddComment,
}: UseCommentDragParams) {
  const draggingRef = useRef(false);
  const draftRef = useRef<DraftRegion | null>(null);
  const [draft, setDraft] = useState<DraftRegion | null>(null);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!commentMode || event.button !== 0) return;
      const point = pointFromEvent(event, frameRef.current);
      if (!point) return;
      draggingRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      const nextDraft = { x: point.x, y: point.y, radius: 0 };
      draftRef.current = nextDraft;
      setDraft(nextDraft);
    },
    [commentMode, frameRef],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      const point = pointFromEvent(event, frameRef.current);
      if (!point || !draftRef.current) return;
      const radius = radiusFromEvent(event, draftRef.current, point.rect);
      const nextDraft = {
        ...draftRef.current,
        radius: Math.min(radius, MAX_REGION_RADIUS),
      };
      draftRef.current = nextDraft;
      setDraft(nextDraft);
    },
    [frameRef],
  );

  const finishDrag = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      const currentDraft = draftRef.current;
      if (currentDraft) {
        const radius =
          currentDraft.radius < CLICK_RADIUS_THRESHOLD
            ? DEFAULT_REGION_RADIUS
            : Math.max(
                MIN_REGION_RADIUS,
                Math.min(currentDraft.radius, MAX_REGION_RADIUS),
              );
        onAddComment(currentDraft.x, currentDraft.y, radius);
      }
      draftRef.current = null;
      setDraft(null);
    },
    [onAddComment],
  );

  return {
    draft,
    handlePointerDown,
    handlePointerMove,
    finishDrag,
  };
}
