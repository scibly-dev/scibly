"use client";

import type { ClientNodeViewBinding } from "@/shared/content/editor/blocks/registry/types";

import { ReactNodeViewRenderer } from "@tiptap/react";

import VideoPlayerView from "./components/video-player";
import { VIDEO_PLAYER_NODE_NAME } from "./schema";

export const videoPlayerNodeViewBindings = [
  {
    nodeViewKey: VIDEO_PLAYER_NODE_NAME,
    nodeView: ReactNodeViewRenderer(VideoPlayerView),
  },
] as const satisfies readonly ClientNodeViewBinding[];
