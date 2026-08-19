"use client";

import type { ClientNodeViewBinding } from "@/shared/content/editor/blocks/registry/types";

import { ReactNodeViewRenderer } from "@tiptap/react";

import AudioPlayerView from "./components/audio-player";
import { AUDIO_PLAYER_NODE_NAME } from "./schema";

export const audioPlayerNodeViewBindings = [
  {
    nodeViewKey: AUDIO_PLAYER_NODE_NAME,
    nodeView: ReactNodeViewRenderer(AudioPlayerView),
  },
] as const satisfies readonly ClientNodeViewBinding[];
