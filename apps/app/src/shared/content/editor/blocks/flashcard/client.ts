"use client";

import type { ClientNodeViewBinding } from "@/shared/content/editor/blocks/registry/types";

import { ReactNodeViewRenderer } from "@tiptap/react";

import FlashcardView from "./components/flashcard-view";
import { CUSTOM_FLASHCARD_NODE_NAME } from "./schema";

export const flashcardNodeViewBindings = [
  {
    nodeViewKey: CUSTOM_FLASHCARD_NODE_NAME,
    nodeView: ReactNodeViewRenderer(FlashcardView),
  },
] as const satisfies readonly ClientNodeViewBinding[];
