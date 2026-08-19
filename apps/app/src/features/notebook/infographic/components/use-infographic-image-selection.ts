"use client";

import { useCallback, useMemo, useState } from "react";

import { useSidebarState } from "../../workspace/hooks/use-sidebar-state";
import {
  type InfographicImage,
  resolveInfographicSelectionId,
} from "./merge-infographic-images";

type InfographicSelectionMode =
  | { type: "follow-newest" }
  | { type: "manual"; imageId: string | null };

function settledSelectionMode(
  mode: InfographicSelectionMode,
  newest: InfographicImage | null,
  isLoading: boolean,
) {
  if (mode.type !== "follow-newest") return undefined;
  if (!newest || isLoading) return undefined;
  if (newest.isDone) return { type: "manual", imageId: newest.id } as const;
  if (newest.isError) return { type: "manual", imageId: null } as const;
  return undefined;
}

function resolveActiveImageId(
  images: InfographicImage[],
  followNewest: boolean,
  openedImageId: string | null,
  mode: InfographicSelectionMode,
) {
  if (followNewest) {
    const pending = images.find((image) => image.isPending);
    if (pending) return pending.id;
    if (images[0]) return images[0].id;
  }
  const openedId = resolveInfographicSelectionId(images, openedImageId);
  if (openedId) return openedId;
  const manualImageId = mode.type === "manual" ? mode.imageId : null;
  return (
    resolveInfographicSelectionId(images, manualImageId) ??
    images[0]?.id ??
    null
  );
}

export function useInfographicImageSelection(
  images: InfographicImage[],
  isLoading: boolean,
) {
  const openedImageId = useSidebarState((s) => s.selectedImageEditorImageId);
  const clearOpenedImage = useSidebarState(
    (s) => s.clearSelectedImageEditorImage,
  );
  const [selectionMode, setSelectionMode] = useState<InfographicSelectionMode>({
    type: "manual",
    imageId: null,
  });
  const [trackedFrontId, setTrackedFrontId] = useState<string | null>(null);

  const newest = images[0] ?? null;
  const frontId = newest?.id ?? null;

  if (frontId !== trackedFrontId) {
    setTrackedFrontId(frontId);
    if (newest?.isPending) {
      setSelectionMode({ type: "follow-newest" });
    }
  }

  const settledMode = settledSelectionMode(selectionMode, newest, isLoading);
  if (settledMode) setSelectionMode(settledMode);

  const followNewest = selectionMode.type === "follow-newest";

  const followNewestGeneration = useCallback(() => {
    clearOpenedImage();
    setSelectionMode({ type: "follow-newest" });
  }, [clearOpenedImage]);

  const activeImageId = useMemo(() => {
    return resolveActiveImageId(
      images,
      followNewest,
      openedImageId,
      selectionMode,
    );
  }, [followNewest, images, openedImageId, selectionMode]);

  const activeImage = useMemo(
    () => images.find((image) => image.id === activeImageId) ?? null,
    [activeImageId, images],
  );

  const awaitingNewGeneration =
    followNewest && isLoading && activeImage?.isPending !== true;

  const selectImage = useCallback(
    (imageId: string) => {
      clearOpenedImage();
      setSelectionMode({ type: "manual", imageId });
    },
    [clearOpenedImage],
  );

  return {
    activeImageId,
    awaitingNewGeneration,
    followNewestGeneration,
    selectImage,
  };
}
