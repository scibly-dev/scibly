"use client";

import type { ClientNodeViewBinding } from "@/shared/content/editor/blocks/registry/types";

import { ReactNodeViewRenderer } from "@tiptap/react";

import MultipleChoiceView from "./components/multiple-choice";
import { MULTIPLE_CHOICE_NODE_NAME } from "./schema";

export const multipleChoiceNodeViewBindings = [
  {
    nodeViewKey: MULTIPLE_CHOICE_NODE_NAME,
    nodeView: ReactNodeViewRenderer(MultipleChoiceView),
  },
] as const satisfies readonly ClientNodeViewBinding[];
