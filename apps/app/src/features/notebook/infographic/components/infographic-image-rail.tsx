"use client";

import type { InfographicImage } from "./merge-infographic-images";

import { Loader2 } from "lucide-react";

import { InfographicThumbnail } from "./infographic-thumbnail";

interface InfographicImageRailProps {
  images: InfographicImage[];
  activeImageId: string | null;
  generatingLabel: string;
  selectImageLabel: string;
  isFetchingNextPage: boolean;
  loadMoreRef: (node: HTMLDivElement | null) => void;
  onSelect: (imageId: string) => void;
  setScrollRoot: (node: HTMLDivElement | null) => void;
}

export function InfographicImageRail({
  images,
  activeImageId,
  generatingLabel,
  selectImageLabel,
  isFetchingNextPage,
  loadMoreRef,
  onSelect,
  setScrollRoot,
}: InfographicImageRailProps) {
  if (images.length === 0 && !isFetchingNextPage) return null;

  return (
    <div
      ref={setScrollRoot}
      className="no-scrollbar flex max-h-[min(420px,50vh)] w-12 shrink-0 flex-col gap-2 overflow-y-auto py-0.5"
    >
      {images.map((image, index) => (
        <InfographicThumbnail
          key={image.id}
          generatingLabel={generatingLabel}
          index={index}
          invocation={image}
          isSelected={activeImageId === image.id}
          onSelect={() => onSelect(image.id)}
          selectImageLabel={selectImageLabel}
        />
      ))}

      <div
        ref={loadMoreRef}
        className="flex h-6 shrink-0 items-center justify-center"
      >
        {isFetchingNextPage ? (
          <Loader2 className="text-ink-faint h-3.5 w-3.5 animate-spin" />
        ) : null}
      </div>
    </div>
  );
}
