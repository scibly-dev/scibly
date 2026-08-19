"use client";

import type { ClientNodeViewBinding } from "@/shared/content/editor/blocks/registry/types";

import { ReactNodeViewRenderer } from "@tiptap/react";

import BlockMathView from "./components/block-math";
import { BLOCK_MATH_NODE_NAME } from "./schema";

export const blockMathNodeViewBindings = [
  {
    nodeViewKey: BLOCK_MATH_NODE_NAME,
    nodeView: ReactNodeViewRenderer(BlockMathView),
  },
] as const satisfies readonly ClientNodeViewBinding[];
