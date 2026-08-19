"use client";

import type { ClientNodeViewBinding } from "@/shared/content/editor/blocks/registry/types";

import { ReactNodeViewRenderer } from "@tiptap/react";

import ClozeGapView from "./cloze-gap/components/cloze-gap-view";
import { CLOZE_GAP_NODE_NAME } from "./cloze-gap/schema";
import ClozeTextView from "./components/cloze-text";
import { CLOZE_TEXT_NODE_NAME } from "./schema";

export const clozeTextNodeViewBindings = [
  {
    nodeViewKey: CLOZE_GAP_NODE_NAME,
    nodeView: ReactNodeViewRenderer(ClozeGapView),
  },
  {
    nodeViewKey: CLOZE_TEXT_NODE_NAME,
    nodeView: ReactNodeViewRenderer(ClozeTextView),
  },
] as const satisfies readonly ClientNodeViewBinding[];
