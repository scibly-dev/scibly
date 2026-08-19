"use client";

import type { ClientNodeViewBinding } from "@/shared/content/editor/blocks/registry/types";

import { ReactNodeViewRenderer } from "@tiptap/react";

import CustomImageView from "./components/custom-image";
import { IMAGE_NODE_NAME } from "./schema";

export const customImageNodeViewBindings = [
  {
    nodeViewKey: IMAGE_NODE_NAME,
    nodeView: ReactNodeViewRenderer(CustomImageView),
  },
] as const satisfies readonly ClientNodeViewBinding[];
