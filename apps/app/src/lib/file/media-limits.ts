import type { MediaTypes } from "@/lib/media-types";

export const allowedMimeTypes = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/webm",
  "audio/mp4",
  "audio/aac",
];

const ONE_MB = 1024 * 1024;
export const maxImageSizeInBytes = 5 * ONE_MB;
const maxImageSizeInMB = maxImageSizeInBytes / ONE_MB;
export const maxVideoSizeInBytes = 300 * ONE_MB;
const maxVideoSizeInMB = maxVideoSizeInBytes / ONE_MB;
export const maxAudioSizeInBytes = 20 * ONE_MB;
const maxAudioSizeInMB = maxAudioSizeInBytes / ONE_MB;
export const MAX_SIZE_BYTES = {
  image: maxImageSizeInBytes,
  video: maxVideoSizeInBytes,
  audio: maxAudioSizeInBytes,
} satisfies Record<MediaTypes, number>;

export const MAX_SIZE_MB = {
  image: maxImageSizeInMB,
  video: maxVideoSizeInMB,
  audio: maxAudioSizeInMB,
} satisfies Record<MediaTypes, number>;
