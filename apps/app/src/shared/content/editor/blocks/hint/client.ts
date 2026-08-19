"use client";

import type { ClientNodeViewBinding } from "@/shared/content/editor/blocks/registry/types";

import { ReactNodeViewRenderer } from "@tiptap/react";

import HintView from "./components/hint";
import { INLINE_HINT_NODE_NAME } from "./schema";

export const hintNodeViewBindings = [
  {
    nodeViewKey: INLINE_HINT_NODE_NAME,
    nodeView: ReactNodeViewRenderer(HintView),
  },
] as const satisfies readonly ClientNodeViewBinding[];
