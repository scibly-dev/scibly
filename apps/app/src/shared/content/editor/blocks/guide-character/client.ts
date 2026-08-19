"use client";

import type { ClientNodeViewBinding } from "@/shared/content/editor/blocks/registry/types";

import { ReactNodeViewRenderer } from "@tiptap/react";

import GuideCharacterView from "./components/guide-character-view";
import { GUIDE_CHARACTER_NODE_NAME } from "./schema";

export const guideCharacterNodeViewBindings = [
  {
    nodeViewKey: GUIDE_CHARACTER_NODE_NAME,
    nodeView: ReactNodeViewRenderer(GuideCharacterView),
  },
] as const satisfies readonly ClientNodeViewBinding[];
