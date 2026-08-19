"use client";

import type { ClientNodeViewBinding } from "@/shared/content/editor/blocks/registry/types";

import { ReactNodeViewRenderer } from "@tiptap/react";

import DragAndDropView from "./components/drag-and-drop";
import { DRAG_AND_DROP_NODE_NAME } from "./schema";

export const dragAndDropNodeViewBindings = [
  {
    nodeViewKey: DRAG_AND_DROP_NODE_NAME,
    nodeView: ReactNodeViewRenderer(DragAndDropView),
  },
] as const satisfies readonly ClientNodeViewBinding[];
