import type { MediaTypes } from "@/lib/media-types";

import { AUDIO_PLAYER_NODE_NAME } from "@/shared/content/editor/blocks/media/audio-player/schema";
import { IMAGE_NODE_NAME } from "@/shared/content/editor/blocks/media/custom-image/schema";
import { VIDEO_PLAYER_NODE_NAME } from "@/shared/content/editor/blocks/media/video-player/schema";

export const MEDIA_TYPE_TO_NODE_NAME = {
  image: IMAGE_NODE_NAME,
  video: VIDEO_PLAYER_NODE_NAME,
  audio: AUDIO_PLAYER_NODE_NAME,
} satisfies Record<MediaTypes, string>;
