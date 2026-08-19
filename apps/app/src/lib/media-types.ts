import { z } from "zod";

const MEDIA_TYPE_VALUES = ["image", "video", "audio"] as const;

export type MediaTypes = (typeof MEDIA_TYPE_VALUES)[number];

export const MediaTypesEnum = {
  IMAGE: "image",
  VIDEO: "video",
  AUDIO: "audio",
} as const;

export const mediaTypeToGermanLabel = {
  image: "Bild",
  video: "Video",
  audio: "Audio",
} satisfies Record<MediaTypes, string>;

export const mediaTypeSchema = z.enum(MEDIA_TYPE_VALUES);
