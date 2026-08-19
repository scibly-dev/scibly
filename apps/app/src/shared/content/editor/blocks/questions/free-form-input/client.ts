"use client";

import type { ClientNodeViewBinding } from "@/shared/content/editor/blocks/registry/types";

import { ReactNodeViewRenderer } from "@tiptap/react";

import FreeFormInputView from "./components/free-form-input";
import { FREE_FORM_INPUT_NODE_NAME } from "./schema";

export const freeFormInputNodeViewBindings = [
  {
    nodeViewKey: FREE_FORM_INPUT_NODE_NAME,
    nodeView: ReactNodeViewRenderer(FreeFormInputView),
  },
] as const satisfies readonly ClientNodeViewBinding[];
