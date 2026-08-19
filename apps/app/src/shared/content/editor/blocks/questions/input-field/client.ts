"use client";

import type { ClientNodeViewBinding } from "@/shared/content/editor/blocks/registry/types";

import { ReactNodeViewRenderer } from "@tiptap/react";

import InputFieldView from "./components/input-field";
import { INPUT_FIELD_NODE_NAME } from "./schema";

export const inputFieldNodeViewBindings = [
  {
    nodeViewKey: INPUT_FIELD_NODE_NAME,
    nodeView: ReactNodeViewRenderer(InputFieldView),
  },
] as const satisfies readonly ClientNodeViewBinding[];
