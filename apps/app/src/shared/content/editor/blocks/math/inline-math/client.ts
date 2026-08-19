"use client";

import type { ClientNodeViewBinding } from "@/shared/content/editor/blocks/registry/types";

import { ReactNodeViewRenderer } from "@tiptap/react";

import InlineMathView from "./components/inline-math";
import { INLINE_MATH_NODE_NAME } from "./schema";

export const inlineMathNodeViewBindings = [
  {
    nodeViewKey: INLINE_MATH_NODE_NAME,
    nodeView: ReactNodeViewRenderer(InlineMathView),
  },
] as const satisfies readonly ClientNodeViewBinding[];
