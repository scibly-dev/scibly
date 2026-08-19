"use client";

import { toast } from "sonner";

import { MAX_SIZE_BYTES, MAX_SIZE_MB } from "@/lib/file/media-limits";
import { type MediaTypes, mediaTypeToGermanLabel } from "@/lib/media-types";
import { isUrl } from "@/lib/utils";

export function validateUrl(url: string, mediaType: MediaTypes): boolean {
  if (!isUrl(url)) {
    toast.error(
      `Bitte gebe einen gültigen ${mediaTypeToGermanLabel[mediaType]} Link ein`,
    );
    return false;
  }
  return true;
}

function getInvalidMediaTypeMessage(mediaType: MediaTypes): string | null {
  switch (mediaType) {
    case "video":
      return "Bitte lade eine gültige Video-Datei hoch";
    case "image":
      return "Bitte lade eine gültige Bild-Datei hoch";
    case "audio":
      return "Bitte lade eine gültige Audio-Datei hoch";
    default:
      return null;
  }
}

export function validateMediaFileType(
  file: File,
  mediaType: MediaTypes,
): boolean {
  const errorMessage = getInvalidMediaTypeMessage(mediaType);
  if (!errorMessage || file.type.startsWith(`${mediaType}/`)) return true;

  toast.error(errorMessage);
  return false;
}

export function validateFileSize(file: File, mediaType: MediaTypes): boolean {
  const maxSize = MAX_SIZE_BYTES[mediaType];
  if (file.size <= maxSize) return true;

  toast.error(
    `Das ${mediaTypeToGermanLabel[mediaType]} darf nicht größer als ${MAX_SIZE_MB[mediaType]} MB sein`,
  );
  return false;
}
